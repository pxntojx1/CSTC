import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format, parseISO } from 'date-fns';
import { simulateMatch, simulateSegment } from '../engine/simulation';
import { calcAttendance, getLoanInterestRate, calcMonthlyLoanPayment } from '../engine/finances';
import { processChampionshipChange } from '../engine/championships';
import { clamp } from '../engine/utils';
import { defaultStipulations, defaultSponsors, defaultTVDeals } from '../data/defaults';

// SP requirement thresholds for free-agent negotiation
export const SP_FOLLOWER_REQ  = [0, 3_000, 15_000, 60_000, 200_000, 600_000];
export const SP_STANDARD_WAGE = [300, 800, 2_000, 5_000, 12_000, 30_000];

const TODAY = format(new Date(), 'yyyy-MM-dd');

const INITIAL_STATE = {
  // ── meta ──────────────────────────────────────────────────────
  initialized:  false,
  gameName:     null,
  currentDate:  TODAY,
  dayNumber:    1,     // total days elapsed (week = Math.ceil(dayNumber/7))
  weekNumber:   1,

  // ── company ───────────────────────────────────────────────────
  company: {
    name:                 'My Wrestling Promotion',
    logo:                 null,
    funds:                500_000,
    followers:            5_000,
    hasTV:                false,
    tvRating:             0,
    tvDealRevenue:        0,
    negativeFundsStreak:  0,
    isBankrupt:           false,
    bankruptcyWeeksRemaining: 0,
  },

  // ── talent ────────────────────────────────────────────────────
  roster:      [],
  talentPool:  [],

  // ── other game data ───────────────────────────────────────────
  shows:              [],
  championships:      [],
  stipulations:       [],
  sponsors:           [],
  activeSponsors:     [],
  tvDeals:            [],
  activeTVDeal:       null,
  loans:              [],
  developmentPrograms:[],
  financeHistory:     [],
  weeklyLog:          [],
  injuries:           {},
};

const useGameStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Session management ──────────────────────────────────────
      startNewGame: ({ gameName, company }) => set({
        ...INITIAL_STATE,
        initialized:  true,
        gameName,
        currentDate:  format(new Date(), 'yyyy-MM-dd'),
        dayNumber:    1,
        weekNumber:   1,
        company: { ...INITIAL_STATE.company, ...company },
        // Pre-load default game data
        stipulations: defaultStipulations,
        sponsors:     defaultSponsors,
        tvDeals:      defaultTVDeals,
      }),

      exitGame: () => set({ initialized: false, gameName: null }),
      markInitialized: () => set({ initialized: true }),

      // ── Import helpers ──────────────────────────────────────────
      importTalentToPool: (talentArray) => set(s => {
        const existing = new Set(s.talentPool.map(t => t.id));
        const toAdd = talentArray
          .filter(t => !existing.has(t.id))
          .map(t => ({
            ...t,
            starPower: clamp(Math.round(t.starPower ?? 0), 0, 5),
            skills: {
              technical: 0, brawling: 0, aerial: 0, strongStyle: 0,
              lucha: 0, physical: 0, athleticism: 0, psychology: 0,
              microphone: 0, acting: 0,
              ...t.skills,
            },
          }));
        return { talentPool: [...s.talentPool, ...toAdd] };
      }),

      importTalent: (talentArray) => set(s => ({
        roster: [
          ...s.roster,
          ...talentArray
            .filter(t => !s.roster.find(r => r.id === t.id))
            .map(t => ({
              ...t,
              starPower: clamp(Math.round(t.starPower ?? 0), 0, 5),
              skills: {
                technical: 0, brawling: 0, aerial: 0, strongStyle: 0,
                lucha: 0, physical: 0, athleticism: 0, psychology: 0,
                microphone: 0, acting: 0,
                ...t.skills,
              },
            })),
        ],
        initialized: true,
      })),

      importStipulations: (stips) => set(s => {
        const merged = [...s.stipulations];
        for (const stip of stips) {
          const idx = merged.findIndex(x => x.id === stip.id);
          if (idx >= 0) merged[idx] = stip; else merged.push(stip);
        }
        return { stipulations: merged };
      }),
      setStipulations: (stips) => set({ stipulations: stips }),

      importCompany: (company) => set(s => ({
        company: { ...s.company, ...company },
        initialized: true,
      })),

      importSponsors: (sponsors) => set(s => ({
        sponsors: [...s.sponsors, ...sponsors.filter(sp => !s.sponsors.find(x => x.id === sp.id))],
      })),
      setSponsors: (sponsors) => set({ sponsors }),

      importTVDeals: (deals) => set(s => ({
        tvDeals: [...s.tvDeals, ...deals.filter(d => !s.tvDeals.find(x => x.id === d.id))],
      })),
      setTVDeals: (deals) => set({ tvDeals: deals }),

      importChampionships: (champs) => set(s => {
        const merged = [...s.championships];
        for (const c of champs) {
          const idx = merged.findIndex(x => x.id === c.id);
          const processed = {
            ...c,
            history: c.history || [],
            prestigeLevel: c.prestigeLevel ?? 5,
          };
          if (processed.currentChampion && !processed.history.length) {
            processed.history = [{
              reignNumber: 1,
              championId: Array.isArray(processed.currentChampion)
                ? processed.currentChampion : [processed.currentChampion],
              championName: 'Imported Champion',
              wonAt: { showId: null, showName: 'Pre-Game', date: processed.dateWon || format(new Date(), 'yyyy-MM-dd') },
              lostAt: null, defenses: 0, reignLengthDays: null,
            }];
          }
          if (idx >= 0) merged[idx] = processed; else merged.push(processed);
        }
        return { championships: merged };
      }),

      createChampionship: (champ) => set(s => ({
        championships: [...s.championships, {
          id: `champ-${Date.now()}`,
          history: [], prestigeLevel: 5, currentChampion: null, ...champ,
        }],
      })),

      // ── Free agent negotiation ──────────────────────────────────
      signTalent: (talentId, salary, durationWeeks) => {
        const s = get();
        const talent = s.talentPool.find(t => t.id === talentId);
        if (!talent) return { success: false, reason: 'Talent not found' };

        const sp  = clamp(Math.round(talent.starPower ?? 0), 0, 5);
        const req = SP_FOLLOWER_REQ[sp];
        const std = SP_STANDARD_WAGE[sp];

        let successRate = req === 0 ? 1 : Math.min(1, s.company.followers / req);
        const salaryBonus = Math.max(0, ((salary - std) / std) * 0.2);
        successRate = Math.min(1, successRate + salaryBonus);
        successRate = Math.max(0.1, successRate);

        const success = Math.random() < successRate;
        if (success) {
          const signedTalent = {
            ...talent,
            contract: { salary: Math.round(salary), expiresInWeeks: Math.round(durationWeeks) },
          };
          set(st => ({
            talentPool: st.talentPool.filter(t => t.id !== talentId),
            roster:     [...st.roster, signedTalent],
          }));
          return { success: true, talent: signedTalent };
        }
        return { success: false, reason: `${talent.name} declined the offer.` };
      },

      // ── Roster management ───────────────────────────────────────
      addTalentToRoster: (talent) => set(s => {
        const existing = s.roster.find(t => t.id === talent.id);
        if (existing) return {};
        return { roster: [...s.roster, talent] };
      }),

      updateTalent: (id, data) => set(s => ({
        roster: s.roster.map(t => t.id === id ? { ...t, ...data } : t),
      })),

      releaseTalent: (id) => set(s => {
        const talent = s.roster.find(t => t.id === id);
        if (!talent) return {};
        const { contract: _, ...talentWithoutContract } = talent;
        return {
          roster:     s.roster.filter(t => t.id !== id),
          talentPool: [...s.talentPool, talentWithoutContract],
        };
      }),

      // ── Company ─────────────────────────────────────────────────
      updateCompany: (data) => set(s => ({ company: { ...s.company, ...data } })),

      // ── Shows ───────────────────────────────────────────────────
      createShow: (show) => set(s => ({
        shows: [...s.shows, {
          id: `show-${Date.now()}`,
          status: 'upcoming', matches: [], segments: [],
          isRecurring: show.type === 'weekly',
          ...show,
        }],
      })),
      updateShow: (id, data) => set(s => ({
        shows: s.shows.map(sh => sh.id === id ? { ...sh, ...data } : sh),
      })),
      deleteShow: (id) => set(s => ({ shows: s.shows.filter(sh => sh.id !== id) })),

      // ── Development ─────────────────────────────────────────────
      createDevelopmentProgram: (prog) => set(s => ({
        developmentPrograms: [...s.developmentPrograms, {
          id: `dev-${Date.now()}`, assignedTalent: [], weeksElapsed: 0, ...prog,
        }],
      })),
      updateProgram: (id, data) => set(s => ({
        developmentPrograms: s.developmentPrograms.map(p => p.id === id ? { ...p, ...data } : p),
      })),
      deleteProgram: (id) => set(s => ({
        developmentPrograms: s.developmentPrograms.filter(p => p.id !== id),
      })),

      // ── Sponsors ────────────────────────────────────────────────
      signSponsor: (sponsorId) => set(s => {
        const sponsor = s.sponsors.find(sp => sp.id === sponsorId);
        if (!sponsor || s.activeSponsors.find(a => a.id === sponsorId)) return {};
        return { activeSponsors: [...s.activeSponsors, { ...sponsor, signedWeek: s.weekNumber }] };
      }),
      cancelSponsor: (id) => set(s => ({
        activeSponsors: s.activeSponsors.filter(a => a.id !== id),
      })),

      // ── TV Deals ────────────────────────────────────────────────
      signTVDeal: (dealId) => set(s => {
        if (s.activeTVDeal) return {};
        const deal = s.tvDeals.find(d => d.id === dealId);
        if (!deal) return {};
        return {
          activeTVDeal: {
            ...deal,
            weeksRemaining: deal.durationWeeks,
            signedWeek: s.weekNumber,
          },
          company: { ...s.company, hasTV: deal.type === 'tv' },
        };
      }),
      cancelTVDeal: () => set(s => {
        if (!s.activeTVDeal) return {};
        const penalty = (s.activeTVDeal.annualValue / 52) * 4;
        return {
          activeTVDeal: null,
          company: {
            ...s.company,
            funds: s.company.funds - Math.abs(penalty),
            hasTV: false,
          },
        };
      }),

      // ── Loans ───────────────────────────────────────────────────
      takeLoan: (amount) => set(s => {
        const rate           = getLoanInterestRate(s.company.followers);
        const monthlyPayment = calcMonthlyLoanPayment(amount, rate);
        const totalRepayment = amount * (1 + rate);
        return {
          loans: [...s.loans, {
            id: `loan-${Date.now()}`, principal: amount, rate, monthlyPayment,
            totalRepayment, amountPaid: 0,
            weeksRemaining: Math.ceil(totalRepayment / monthlyPayment) * 4,
            takenWeek: s.weekNumber, status: 'active',
          }],
          company: { ...s.company, funds: s.company.funds + amount },
        };
      }),

      takeEmergencyLoan: () => set(s => {
        const amount = 250_000; const rate = 0.25;
        const monthly = calcMonthlyLoanPayment(amount, rate);
        return {
          loans: [...s.loans, {
            id: `loan-emergency-${Date.now()}`, principal: amount, rate,
            monthlyPayment: monthly, totalRepayment: amount * (1 + rate),
            amountPaid: 0,
            weeksRemaining: Math.ceil(amount * 1.25 / monthly) * 4,
            takenWeek: s.weekNumber, status: 'active', isEmergency: true,
          }],
          company: { ...s.company, funds: s.company.funds + amount },
        };
      }),

      // ── Simulate Show ────────────────────────────────────────────
      runShow: (showId) => set(s => {
        const show = s.shows.find(sh => sh.id === showId);
        if (!show || show.status === 'completed') return {};

        const isPPV = show.type === 'ppv';
        const results = [];
        let totalImpressions = 0;
        const spChanges          = {};
        const skillGrowthMap     = {};
        const injuryMap          = { ...s.injuries };
        let updatedChampionships = [...s.championships];
        let updatedRoster        = [...s.roster];

        for (const match of (show.matches || [])) {
          const champ  = match.championshipId
            ? updatedChampionships.find(c => c.id === match.championshipId) : null;
          const result = simulateMatch(match, updatedRoster, s.stipulations, isPPV, champ);
          if (!result) continue;

          results.push({ type: 'match', matchId: match.id, ...result });
          totalImpressions += result.impressions;

          for (const { talentId, newSP } of result.starPowerChanges) {
            spChanges[talentId] = newSP;
          }
          for (const { talentId, skill, amount } of result.skillGrowth) {
            if (!skillGrowthMap[talentId]) skillGrowthMap[talentId] = {};
            skillGrowthMap[talentId][skill] = (skillGrowthMap[talentId][skill] || 0) + amount;
          }
          for (const { talentId, weeksOut } of result.injuries) {
            injuryMap[talentId] = s.dayNumber + weeksOut * 7;
          }
          if (champ && match.winnerId) {
            const winnerNames = (Array.isArray(match.winnerId) ? match.winnerId : [match.winnerId])
              .map(id => updatedRoster.find(t => t.id === id)?.name || 'Unknown').join(' & ');
            const updated = processChampionshipChange(
              champ, { ...match, winnerNames }, show, parseISO(show.date)
            );
            updatedChampionships = updatedChampionships.map(c => c.id === champ.id ? updated : c);
          }
        }

        for (const seg of (show.segments || [])) {
          const result = simulateSegment(seg, updatedRoster);
          if (!result) continue;
          results.push({ type: 'segment', segmentId: seg.id, ...result });
          totalImpressions += result.impressions;
          for (const { talentId, newSP } of result.starPowerChanges) {
            spChanges[talentId] = newSP;
          }
        }

        updatedRoster = updatedRoster.map(t => {
          const newSP = spChanges[t.id] !== undefined ? spChanges[t.id] : Math.round(t.starPower ?? 0);
          const skillChanges = skillGrowthMap[t.id] || {};
          const newSkills = { ...t.skills };
          for (const [sk, amt] of Object.entries(skillChanges)) {
            newSkills[sk] = clamp((newSkills[sk] || 0) + amt, 0, 100);
          }
          return { ...t, starPower: newSP, skills: newSkills };
        });

        const attendance   = calcAttendance(show, s.company);
        const revenue      = attendance * (show.ticketPrice || 0);
        const venueCost    = show.venue?.rentalCost || 0;
        const newFollowers = Math.max(0, s.company.followers + totalImpressions);
        const matchResults = results.filter(r => r.type === 'match');
        const avgRating    = matchResults.length
          ? matchResults.reduce((a, r) => a + r.finalRating, 0) / matchResults.length : 0;
        const tvAdj = s.activeTVDeal ? (avgRating - 2.5) * 0.01 : 0;

        // ── Weekly show recurrence: schedule next occurrence 7 days later ──
        let newShows = s.shows.map(sh => sh.id === showId
          ? { ...sh, status: 'completed', results, actualAttendance: attendance, revenue, totalImpressions }
          : sh
        );

        if (show.isRecurring && show.type === 'weekly') {
          const nextDate = format(addDays(parseISO(show.date), 7), 'yyyy-MM-dd');
          // Only auto-create if not already existing
          const alreadyExists = newShows.some(sh =>
            sh.name === show.name && sh.date === nextDate && sh.status === 'upcoming'
          );
          if (!alreadyExists) {
            newShows = [...newShows, {
              ...show,
              id: `show-${Date.now()}-next`,
              date: nextDate,
              status: 'upcoming',
              results: [],
              actualAttendance: undefined,
              revenue: undefined,
              totalImpressions: undefined,
              matches: [],    // fresh booking sheet
              segments: [],
            }];
          }
        }

        return {
          shows: newShows,
          championships: updatedChampionships,
          roster:    updatedRoster,
          injuries:  injuryMap,
          company: {
            ...s.company,
            funds:     s.company.funds + revenue - venueCost,
            followers: Math.round(newFollowers),
            tvRating:  clamp((s.company.tvRating || 0) + tvAdj, 0, 10),
          },
        };
      }),

      // ── Advance Day ──────────────────────────────────────────────
      advanceDay: () => set(s => {
        const nextDate  = format(addDays(parseISO(s.currentDate), 1), 'yyyy-MM-dd');
        const newDay    = s.dayNumber + 1;
        const newWeek   = Math.ceil(newDay / 7);
        const isWeekly  = newDay % 7 === 0;    // every 7 days
        const isMonthly = newDay % 28 === 0;   // every 28 days

        let funds = s.company.funds;
        const log = [];

        if (isWeekly) {
          // Salaries (weekly)
          const salaryTotal = s.roster.reduce((sum, t) => sum + (t.contract?.salary || 0), 0);
          funds -= salaryTotal;
          if (salaryTotal) log.push({ label: 'Talent Salaries', amount: -salaryTotal });

          // TV Deal revenue (weekly slice)
          let updatedTVDeal = s.activeTVDeal;
          if (updatedTVDeal) {
            const wkTV = updatedTVDeal.annualValue / 52;
            funds += wkTV;
            log.push({ label: `TV: ${updatedTVDeal.name}`, amount: wkTV });
            updatedTVDeal = { ...updatedTVDeal, weeksRemaining: updatedTVDeal.weeksRemaining - 1 };
            if (updatedTVDeal.weeksRemaining <= 0) {
              updatedTVDeal = null;
              log.push({ label: 'TV Deal Expired', amount: 0 });
            }
          }

          // Sponsor revenue (weekly slice)
          let updatedSponsors = [...s.activeSponsors];
          for (const sp of updatedSponsors) {
            const pay = sp.annualPayment / 52;
            funds += pay;
            log.push({ label: `Sponsor: ${sp.name}`, amount: pay });
          }
          updatedSponsors = updatedSponsors.filter(sp => {
            if (s.company.followers < sp.minimumFollowers) {
              log.push({ label: `Sponsor Cancelled: ${sp.name}`, amount: 0 });
              return false;
            }
            return true;
          });

          // Dev programs (weekly cost + growth)
          let updatedPrograms = s.developmentPrograms.map(prog => {
            if (s.company.isBankrupt) return prog;
            funds -= prog.weeklyCost || 0;
            if (prog.weeklyCost) log.push({ label: `Dev: ${prog.name}`, amount: -(prog.weeklyCost) });
            return { ...prog, weeksElapsed: prog.weeksElapsed + 1 };
          });

          // Contract countdown
          const expiringTalent = [];
          let updatedRoster = s.roster.map(t => {
            if (!t.contract) return t;
            const weeksLeft = t.contract.expiresInWeeks - 1;
            if (weeksLeft <= 0) expiringTalent.push(t.id);
            return { ...t, contract: { ...t.contract, expiresInWeeks: weeksLeft } };
          });

          // Dev growth
          const growthMap = {};
          for (const prog of updatedPrograms) {
            if (s.company.isBankrupt) break;
            const pool = prog.type === 'Combat'
              ? ['technical','brawling','aerial','strongStyle','lucha','physical','athleticism','psychology']
              : ['microphone','acting'];
            for (const talentId of (prog.assignedTalent || [])) {
              if (!growthMap[talentId]) growthMap[talentId] = [];
              const sk  = pool[Math.floor(Math.random() * pool.length)];
              const amt = Math.floor(Math.random() * (prog.growthPerWeek || 1)) + 1;
              growthMap[talentId].push({ skill: sk, amount: amt });
            }
          }
          updatedRoster = updatedRoster.map(t => {
            const growthArr = growthMap[t.id] || [];
            if (!growthArr.length) return t;
            const newSkills = { ...t.skills };
            for (const { skill, amount } of growthArr) {
              newSkills[skill] = clamp((newSkills[skill] || 0) + amount, 0, 100);
            }
            return { ...t, skills: newSkills };
          });

          // Monthly financials
          let { negativeFundsStreak = 0, isBankrupt = false, bankruptcyWeeksRemaining = 0 } = s.company;
          if (isMonthly) {
            // Loan payments
            let updatedLoans = [...s.loans].map(loan => {
              if (loan.status !== 'active') return loan;
              funds -= loan.monthlyPayment;
              log.push({ label: 'Loan Payment', amount: -loan.monthlyPayment });
              const paid = loan.amountPaid + loan.monthlyPayment;
              if (paid >= loan.totalRepayment) return { ...loan, amountPaid: paid, status: 'paid' };
              return { ...loan, amountPaid: paid, weeksRemaining: loan.weeksRemaining - 4 };
            });

            // Bankruptcy check
            funds < 0 ? negativeFundsStreak++ : (negativeFundsStreak = 0);
            if (negativeFundsStreak >= 6 && !isBankrupt) {
              isBankrupt = true;
              bankruptcyWeeksRemaining = 8;
              updatedTVDeal    = null;
              updatedSponsors  = [];
            }
            if (isBankrupt) {
              bankruptcyWeeksRemaining--;
              if (funds >= 0) { isBankrupt = false; bankruptcyWeeksRemaining = 0; negativeFundsStreak = 0; }
            }

            const historyEntry = { day: newDay, week: newWeek, date: nextDate, funds, log };
            return {
              currentDate:  nextDate,
              dayNumber:    newDay,
              weekNumber:   newWeek,
              roster:       updatedRoster,
              developmentPrograms: updatedPrograms,
              loans:        updatedLoans,
              activeTVDeal: updatedTVDeal,
              activeSponsors: updatedSponsors,
              company: { ...s.company, funds: Math.round(funds), negativeFundsStreak, isBankrupt, bankruptcyWeeksRemaining },
              financeHistory: [...(s.financeHistory || []).slice(-51), historyEntry],
              weeklyLog:      [...(s.weeklyLog || []).slice(-51), { day: newDay, week: newWeek, date: nextDate, log, expiringTalent }],
            };
          }

          // Weekly (not monthly)
          const historyEntry = { day: newDay, week: newWeek, date: nextDate, funds, log };
          return {
            currentDate:  nextDate,
            dayNumber:    newDay,
            weekNumber:   newWeek,
            roster:       updatedRoster,
            developmentPrograms: updatedPrograms,
            activeTVDeal: updatedTVDeal,
            activeSponsors: updatedSponsors,
            company: { ...s.company, funds: Math.round(funds), negativeFundsStreak, isBankrupt, bankruptcyWeeksRemaining },
            financeHistory: [...(s.financeHistory || []).slice(-51), historyEntry],
            weeklyLog:      [...(s.weeklyLog || []).slice(-51), { day: newDay, week: newWeek, date: nextDate, log, expiringTalent: [] }],
          };
        }

        // Plain day advance (no weekly financials)
        return {
          currentDate: nextDate,
          dayNumber:   newDay,
          weekNumber:  newWeek,
        };
      }),

      resetGame: () => set({ ...INITIAL_STATE, currentDate: format(new Date(), 'yyyy-MM-dd') }),
    }),
    { name: 'pwb-game-save-v2', version: 2 }
  )
);

export default useGameStore;
