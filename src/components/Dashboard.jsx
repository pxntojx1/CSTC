import { useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { calcOverallRating, calcSkillRating, calcEntertainmentRating } from '../engine/simulation';
import { formatCurrency, formatFollowers } from '../engine/utils';
import { getChampionNames } from '../engine/championships';
import { parseISO, differenceInDays, format } from 'date-fns';

function StatCard({ label, value, sub, trend, alert }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 140 }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: alert ? 'var(--danger)' : 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function PrestigeBar({ value, max = 10 }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i < value ? 'var(--gold)' : 'var(--border)',
        }} />
      ))}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const {
    company, roster, shows, championships, activeTVDeal,
    activeSponsors, currentDate, weekNumber, financeHistory,
  } = useGameStore();

  const nextShow = useMemo(() => {
    const upcoming = shows.filter(s => s.status !== 'completed' && s.date >= currentDate);
    return upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [shows, currentDate]);

  const top5Talent = useMemo(() => (
    [...roster].sort((a, b) => calcOverallRating(b) - calcOverallRating(a)).slice(0, 5)
  ), [roster]);

  const isBankrupt    = company.isBankrupt;
  const streakWarning = company.negativeFundsStreak >= 3;
  const streakCritical = company.negativeFundsStreak >= 5;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ fontSize: 26 }}>{company.name}</div>
        <div className="section-sub">
          Week {weekNumber} — {format(parseISO(currentDate), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Alerts */}
      {isBankrupt && (
        <div style={{
          background: 'var(--danger-lt)', border: '1px solid #fca5a5', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, color: '#991b1b',
          fontWeight: 600, fontSize: 14,
        }}>
          ⚠️ COMPANY IS BANKRUPT — {company.bankruptcyWeeksRemaining} weeks to recover or game ends
        </div>
      )}
      {!isBankrupt && streakCritical && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, color: '#9a3412', fontSize: 14, fontWeight: 600,
        }}>
          🚨 BANKRUPTCY IMMINENT — 1 month remaining before bankruptcy
        </div>
      )}
      {!isBankrupt && !streakCritical && streakWarning && (
        <div style={{
          background: 'var(--warning-lt)', border: '1px solid #fcd34d', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, color: '#92400e', fontSize: 14,
        }}>
          ⚠️ Financial Warning: {company.negativeFundsStreak} consecutive months with negative balance
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard
          label="Balance"
          value={formatCurrency(company.funds)}
          alert={company.funds < 0}
          sub={company.funds < 0 ? 'Negative balance!' : null}
        />
        <StatCard
          label="Followers"
          value={formatFollowers(company.followers)}
        />
        <StatCard
          label="Roster"
          value={roster.length}
          sub={`${roster.filter(t => t.type === 'wrestler').length} wrestlers`}
        />
        <StatCard
          label="Sponsors"
          value={activeSponsors.length}
          sub={activeSponsors.length ? `+${formatCurrency(activeSponsors.reduce((s, sp) => s + sp.annualPayment / 52, 0))}/wk` : 'None active'}
        />
        {activeTVDeal && (
          <StatCard
            label="TV Deal"
            value={activeTVDeal.name.split(' ').slice(0, 2).join(' ')}
            sub={`${activeTVDeal.weeksRemaining} weeks left`}
          />
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Next Show */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)', letterSpacing: 0.5 }}>
              NEXT SHOW
            </div>
            <button
              onClick={() => onNavigate?.('shows')}
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
            >
              All Shows →
            </button>
          </div>
          {nextShow ? (
            <div>
              <div style={{ fontSize: 18, fontFamily: 'Anton, sans-serif', color: 'var(--text)', marginBottom: 6 }}>
                {nextShow.name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className={`badge ${nextShow.type === 'ppv' ? 'badge-purple' : 'badge-blue'}`}>
                  {nextShow.type?.toUpperCase() || 'SHOW'}
                </span>
                {nextShow.venue?.city && (
                  <span className="badge badge-gray">{nextShow.venue.city}</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                📅 {format(parseISO(nextShow.date), 'EEEE, MMMM d, yyyy')}
              </div>
              {nextShow.venue?.name && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  📍 {nextShow.venue.name}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                {(nextShow.matches || []).length} matches · {(nextShow.segments || []).length} segments
              </div>
              <button
                onClick={() => onNavigate?.('shows')}
                className="btn btn-primary"
                style={{ marginTop: 14 }}
              >
                Book Show
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-faint)', fontSize: 14, paddingTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              No upcoming shows scheduled.
              <br />
              <button onClick={() => onNavigate?.('shows')} className="btn btn-secondary" style={{ marginTop: 12 }}>
                + Create Show
              </button>
            </div>
          )}
        </div>

        {/* Championships */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)', letterSpacing: 0.5 }}>
              CHAMPIONSHIPS
            </div>
            <button onClick={() => onNavigate?.('championships')} className="btn btn-ghost" style={{ fontSize: 12 }}>
              Manage →
            </button>
          </div>
          {championships.length === 0 ? (
            <div style={{ color: 'var(--text-faint)', fontSize: 14, paddingTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              No championships created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {championships.slice(0, 5).map(c => {
                const champName = getChampionNames(c, roster);
                const daysIntoReign = c.dateWon
                  ? differenceInDays(parseISO(currentDate), parseISO(c.dateWon))
                  : null;
                return (
                  <div key={c.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                      {champName ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {champName}{daysIntoReign != null ? ` · ${daysIntoReign}d` : ''}
                        </div>
                      ) : (
                        <span className="badge badge-red" style={{ marginTop: 4 }}>VACANT</span>
                      )}
                    </div>
                    <PrestigeBar value={c.prestigeLevel} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Talent */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)', letterSpacing: 0.5 }}>
              TOP TALENT
            </div>
            <button onClick={() => onNavigate?.('roster')} className="btn btn-ghost" style={{ fontSize: 12 }}>
              Full Roster →
            </button>
          </div>
          {top5Talent.length === 0 ? (
            <div style={{ color: 'var(--text-faint)', fontSize: 14, paddingTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              No talent on roster. Sign free agents!
              <br />
              <button onClick={() => onNavigate?.('freeagents')} className="btn btn-secondary" style={{ marginTop: 12 }}>
                Free Agents →
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ textAlign: 'center' }}>SKL</th>
                  <th style={{ textAlign: 'center' }}>ENT</th>
                  <th style={{ textAlign: 'center' }}>OVR</th>
                  <th style={{ textAlign: 'center' }}>SP</th>
                </tr>
              </thead>
              <tbody>
                {top5Talent.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: i === 0 ? 600 : 400, color: 'var(--text)' }}>
                      {i === 0 && <span style={{ marginRight: 4 }}>👑</span>}
                      {t.name}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{calcSkillRating(t.skills)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{calcEntertainmentRating(t.skills)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary-d)' }}>{calcOverallRating(t)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--gold)' }}>
                      {'★'.repeat(Math.round(t.starPower || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Finance History */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)', letterSpacing: 0.5 }}>
              RECENT ACTIVITY
            </div>
            <button onClick={() => onNavigate?.('finances')} className="btn btn-ghost" style={{ fontSize: 12 }}>
              Finances →
            </button>
          </div>
          {(financeHistory || []).length === 0 ? (
            <div style={{ color: 'var(--text-faint)', fontSize: 14, paddingTop: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              No history yet — advance a week to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...(financeHistory || [])].slice(-6).reverse().map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Week {entry.week}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: entry.funds < 0 ? 'var(--danger)' : 'var(--primary-d)',
                  }}>
                    {formatCurrency(entry.funds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
