import { useState, useRef } from 'react';
import useGameStore, { SP_FOLLOWER_REQ, SP_STANDARD_WAGE } from '../store/gameStore';
import { calcOverallRating, calcSkillRating, calcEntertainmentRating } from '../engine/simulation';
import { formatFollowers, formatCurrency, clamp } from '../engine/utils';

const STAR_LABELS = ['Unknown', 'Local', 'Regional', 'Semi-Main', 'Main Event', 'Superstar'];
const TYPE_COLORS = {
  wrestler: { bg: '#dbeafe', color: '#1d4ed8' },
  manager:  { bg: '#ede9fe', color: '#6d28d9' },
  referee:  { bg: '#fef3c7', color: '#92400e' },
  announcer:{ bg: '#d1fae5', color: '#065f46' },
};

function StarRow({ value }) {
  return (
    <span style={{ color: '#f59e0b', letterSpacing: 1 }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function SuccessBar({ rate }) {
  const pct   = Math.round(rate * 100);
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#6b7280', fontSize: 11 }}>Sign probability</span>
        <span style={{ color, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function NegotiateModal({ talent, onClose }) {
  const { company, signTalent } = useGameStore();
  const sp  = clamp(Math.round(talent.starPower ?? 0), 0, 5);
  const std = SP_STANDARD_WAGE[sp];
  const req = SP_FOLLOWER_REQ[sp];

  const [salary, setSalary]     = useState(std);
  const [weeks, setWeeks]       = useState(52);
  const [result, setResult]     = useState(null);

  const baseRate     = req === 0 ? 1 : Math.min(1, company.followers / req);
  const salaryBonus  = Math.max(0, ((salary - std) / std) * 0.2);
  // Shorter contract → higher chance. 4 wks = +20%, 52 wks = 0%, 156 wks = -10%
  const durationBonus = ((52 - weeks) / 52) * 0.2;
  const successRate  = Math.max(0.1, Math.min(1, baseRate + salaryBonus + durationBonus));

  const handleSign = () => {
    const res = signTalent(talent.id, salary, weeks);
    setResult(res);
  };

  const tc = TYPE_COLORS[talent.type] || TYPE_COLORS.wrestler;
  const ovr = calcOverallRating(talent);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontFamily: 'Anton, sans-serif', color: '#059669', flexShrink: 0,
          }}>
            {talent.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#111827' }}>
              {talent.name}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{
                background: tc.bg, color: tc.color,
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>{talent.type}</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>OVR {ovr}</span>
              <span style={{ fontSize: 12 }}><StarRow value={sp} /></span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              {result.success ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: '#10b981', marginBottom: 8 }}>
                    DEAL SIGNED!
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {talent.name} has joined your roster at ${salary.toLocaleString()}/wk
                    for {weeks} weeks.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>😤</div>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#ef4444', marginBottom: 8 }}>
                    OFFER REJECTED
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                    {result.reason}
                  </div>
                  <button onClick={() => setResult(null)} style={{
                    padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
                    background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', fontSize: 13,
                  }}>
                    Try Again
                  </button>
                </>
              )}
              {result.success && (
                <button onClick={onClose} style={{
                  marginTop: 16, padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                  background: '#10b981', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
                }}>
                  Done
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Requirement info */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Negotiation Requirements</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Star Level</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {STAR_LABELS[sp]} (SP {sp})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Followers Needed</div>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: company.followers >= req ? '#10b981' : '#ef4444',
                    }}>
                      {req === 0 ? 'None' : formatFollowers(req)}
                      {req > 0 && (
                        <span style={{ fontWeight: 400, color: '#9ca3af' }}>
                          {' '}(you: {formatFollowers(company.followers)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Market Rate</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {formatCurrency(std)}/wk
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary slider */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Weekly Salary</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(salary)}/wk
                  </span>
                </div>
                <input type="range" min={Math.max(100, Math.round(std * 0.5))} max={Math.round(std * 3)}
                  step={50} value={salary} onChange={e => setSalary(Number(e.target.value))}
                  style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                  <span>Min {formatCurrency(Math.max(100, Math.round(std * 0.5)))}</span>
                  <span>3× rate {formatCurrency(Math.round(std * 3))}</span>
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Contract Duration</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {durationBonus > 0.01 && (
                      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                        +{Math.round(durationBonus * 100)}% chance ↑
                      </span>
                    )}
                    {durationBonus < -0.01 && (
                      <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                        {Math.round(durationBonus * 100)}% chance ↓
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      {weeks} weeks ({(weeks / 52).toFixed(1)} yr)
                    </span>
                  </div>
                </div>
                <input type="range" min={4} max={156} step={4} value={weeks}
                  onChange={e => setWeeks(Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                  <span style={{ color: '#10b981' }}>4 wks (easier)</span>
                  <span>52 wks (standard)</span>
                  <span style={{ color: '#ef4444' }}>3 yrs (harder)</span>
                </div>
              </div>

              {/* Total cost */}
              <div style={{
                background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#059669' }}>Total contract value</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
                  {formatCurrency(salary * weeks)}
                </span>
              </div>

              <SuccessBar rate={successRate} />

              <button
                onClick={handleSign}
                style={{
                  width: '100%', marginTop: 20, padding: '14px 0',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: 10, color: '#fff',
                  fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: 1,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                MAKE OFFER
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TalentCard({ talent, onNegotiate }) {
  const sp  = clamp(Math.round(talent.starPower ?? 0), 0, 5);
  const ovr = calcOverallRating(talent);
  const sk  = calcSkillRating(talent.skills);
  const ent = calcEntertainmentRating(talent.skills);
  const tc  = TYPE_COLORS[talent.type] || TYPE_COLORS.wrestler;

  return (
    <div className="card" style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Avatar */}
      {talent.image ? (
        <img src={talent.image} alt={talent.name}
          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />
      ) : (
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#059669',
        }}>
          {talent.name.charAt(0)}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#111827' }}>{talent.name}</span>
          <span style={{
            background: tc.bg, color: tc.color,
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{talent.type}</span>
        </div>
        <div style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#f59e0b', fontSize: 13 }}>
            {'★'.repeat(sp)}{'☆'.repeat(5 - sp)}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{STAR_LABELS[sp]}</span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            OVR <strong style={{ color: '#111827' }}>{ovr}</strong>
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            SKL <strong style={{ color: '#111827' }}>{sk}</strong>
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            ENT <strong style={{ color: '#111827' }}>{ent}</strong>
          </span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Mkt <strong style={{ color: '#10b981' }}>{formatCurrency(SP_STANDARD_WAGE[sp])}/wk</strong>
          </span>
        </div>
      </div>

      <button
        onClick={() => onNegotiate(talent)}
        className="btn btn-primary"
        style={{ flexShrink: 0, alignSelf: 'center' }}
      >
        Negotiate
      </button>
    </div>
  );
}

export default function FreeAgentsPanel() {
  const { talentPool, importTalentToPool } = useGameStore();
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy]     = useState('ovr');

  const filtered = talentPool
    .filter(t => {
      const q = search.toLowerCase();
      return (typeFilter === 'all' || t.type === typeFilter) &&
        (!q || t.name.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'ovr') return calcOverallRating(b) - calcOverallRating(a);
      if (sortBy === 'sp')  return (b.starPower ?? 0) - (a.starPower ?? 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleJsonImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importTalentToPool(Array.isArray(data) ? data : [data]);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title">Free Agent Pool</div>
          <div className="section-sub">{talentPool.length} talent available to sign</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📂 Import JSON
            <input type="file" accept=".json" onChange={handleJsonImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search name…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 140 }}>
          <option value="all">All Types</option>
          <option value="wrestler">Wrestlers</option>
          <option value="manager">Managers</option>
          <option value="referee">Referees</option>
          <option value="announcer">Announcers</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 140 }}>
          <option value="ovr">Sort: Overall</option>
          <option value="sp">Sort: Star Power</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          {talentPool.length === 0 ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>
                No free agents available
              </div>
              <div style={{ fontSize: 13 }}>
                Import a talent JSON file to populate the free agent pool.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14 }}>No talent match your filters.</div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => (
            <TalentCard key={t.id} talent={t} onNegotiate={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <NegotiateModal talent={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
