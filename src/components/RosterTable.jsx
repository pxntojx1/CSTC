import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { calcOverallRating, calcSkillRating, calcEntertainmentRating } from '../engine/simulation';
import { formatCurrency, clamp } from '../engine/utils';

const SORT_KEYS = {
  name:          t => t.name,
  type:          t => t.type,
  overall:       t => calcOverallRating(t),
  skill:         t => calcSkillRating(t.skills),
  entertainment: t => calcEntertainmentRating(t.skills),
  starPower:     t => t.starPower || 0,
  salary:        t => t.contract?.salary || 0,
  expires:       t => t.contract?.expiresInWeeks || 0,
};

const TYPE_COLORS = {
  wrestler: { bg: '#dbeafe', color: '#1d4ed8' },
  manager:  { bg: '#ede9fe', color: '#6d28d9' },
  referee:  { bg: '#fef3c7', color: '#92400e' },
  announcer:{ bg: '#d1fae5', color: '#065f46' },
};

const SKILL_LABEL = {
  technical: 'Technical', brawling: 'Brawling', aerial: 'Aerial',
  strongStyle: 'Strong Style', lucha: 'Lucha', physical: 'Physical',
  athleticism: 'Athleticism', psychology: 'Psychology',
  microphone: 'Microphone', acting: 'Acting',
};
const COMBAT_SKILLS = ['technical','brawling','aerial','strongStyle','lucha','physical','athleticism','psychology'];
const ENT_SKILLS    = ['microphone','acting'];

/* ─── Read-only Talent Profile ─────────────────────────────────── */
function TalentProfile({ talent, onClose }) {
  const { releaseTalent, dayNumber } = useGameStore();
  const sp  = clamp(Math.round(talent.starPower ?? 0), 0, 5);
  const ovr = calcOverallRating(talent);
  const sk  = calcSkillRating(talent.skills);
  const ent = calcEntertainmentRating(talent.skills);
  const tc  = TYPE_COLORS[talent.type] || TYPE_COLORS.wrestler;
  const [confirmRelease, setConfirmRelease] = useState(false);

  const handleRelease = () => {
    releaseTalent(talent.id);
    onClose();
  };

  const SkillBar = ({ label, value, color = 'var(--primary)' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ width: 96, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ width: 28, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {talent.image ? (
              <img src={talent.image} alt={talent.name}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#059669',
              }}>
                {talent.name.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: 'var(--text)' }}>{talent.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <span style={{ background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>
                  {talent.type}
                </span>
                <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(sp)}{'☆'.repeat(5 - sp)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>

        <div className="modal-body">
          {/* OVR row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Overall', val: ovr, color: 'var(--primary-d)' },
              { label: 'Skill',   val: sk,  color: '#3b82f6' },
              { label: 'Entert.', val: ent, color: '#8b5cf6' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 30, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Contract */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontWeight: 600 }}>Contract</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Weekly Salary</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(talent.contract?.salary || 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Weeks Remaining</div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: (talent.contract?.expiresInWeeks || 0) <= 4 ? 'var(--danger)' : 'var(--text)',
                }}>
                  {talent.contract?.expiresInWeeks || '—'}
                  {(talent.contract?.expiresInWeeks || 0) <= 4 && ' ⚠'}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--primary-d)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 10 }}>Combat Skills</div>
            {COMBAT_SKILLS.map(sk => (
              <SkillBar key={sk} label={SKILL_LABEL[sk]} value={talent.skills?.[sk] || 0} color="var(--primary)" />
            ))}
            <div style={{ fontSize: 11, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, margin: '14px 0 10px' }}>Entertainment</div>
            {ENT_SKILLS.map(sk => (
              <SkillBar key={sk} label={SKILL_LABEL[sk]} value={talent.skills?.[sk] || 0} color="#8b5cf6" />
            ))}
          </div>
        </div>

        <div className="modal-footer">
          {!confirmRelease ? (
            <>
              <button onClick={onClose} className="btn btn-secondary">Close</button>
              <button onClick={() => setConfirmRelease(true)} className="btn btn-danger">
                Release Talent
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>
                Release {talent.name}? They'll return to the free agent pool.
              </span>
              <button onClick={() => setConfirmRelease(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRelease} className="btn btn-danger">Confirm Release</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Roster Table ─────────────────────────────────────────── */
export default function RosterTable() {
  const { roster, injuries, dayNumber } = useGameStore();
  const [sortKey, setSortKey] = useState('overall');
  const [sortDir, setSortDir] = useState(-1);
  const [filter,  setFilter]  = useState('all');
  const [selected, setSelected] = useState(null);
  const [search,  setSearch]  = useState('');

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const filtered = roster
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const fn = SORT_KEYS[sortKey] || (() => 0);
      return (fn(b) > fn(a) ? 1 : -1) * sortDir;
    });

  const SortTH = ({ label, k, align = 'center' }) => (
    <th
      onClick={() => toggleSort(k)}
      style={{ cursor: 'pointer', textAlign: align, userSelect: 'none' }}
    >
      {label} {sortKey === k ? (sortDir === -1 ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="section-title">Roster</div>
          <div className="section-sub">
            {roster.length} talent under contract
            {' · '}
            <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>
              To add talent, negotiate contracts in Free Agents
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{ flex: 1, minWidth: 180 }}
        />
        {['all','wrestler','manager','referee','announcer'].map(f => {
          const active = filter === f;
          const tc = TYPE_COLORS[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
              background: active ? (tc?.bg || '#f3f4f6') : 'var(--card)',
              color: active ? (tc?.color || 'var(--text)') : 'var(--text-muted)',
              border: `1px solid ${active ? (tc?.color || 'var(--border)') : 'var(--border)'}`,
              fontWeight: active ? 700 : 400,
            }}>
              {f === 'all' ? `All (${roster.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortTH label="Name"       k="name"          align="left" />
                <SortTH label="Type"       k="type" />
                <SortTH label="OVR"        k="overall" />
                <SortTH label="Skill"      k="skill" />
                <SortTH label="Ent."       k="entertainment" />
                <SortTH label="⭐ SP"       k="starPower" />
                <SortTH label="Salary/wk"  k="salary" />
                <SortTH label="Contract"   k="expires" />
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const isInjured = injuries[t.id] && injuries[t.id] > dayNumber;
                const daysOut   = isInjured ? injuries[t.id] - dayNumber : 0;
                const ovr       = calcOverallRating(t);
                const sp        = clamp(Math.round(t.starPower ?? 0), 0, 5);
                const tc        = TYPE_COLORS[t.type] || TYPE_COLORS.wrestler;
                const expiring  = (t.contract?.expiresInWeeks || 0) <= 4 && (t.contract?.expiresInWeeks || 0) > 0;

                return (
                  <tr key={t.id} onClick={() => setSelected(t)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {t.image ? (
                          <img src={t.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Anton, sans-serif', fontSize: 13, color: '#059669',
                          }}>
                            {t.name.charAt(0)}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontFamily: 'Anton, sans-serif', fontSize: 20,
                        color: ovr >= 80 ? '#f59e0b' : ovr >= 60 ? 'var(--primary-d)' : 'var(--text-muted)',
                      }}>{ovr}</span>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{calcSkillRating(t.skills)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{calcEntertainmentRating(t.skills)}</td>
                    <td style={{ textAlign: 'center', color: '#f59e0b', fontSize: 14 }}>
                      {'★'.repeat(sp)}{'☆'.repeat(5 - sp)}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {formatCurrency(t.contract?.salary || 0)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: expiring ? 'var(--danger)' : 'var(--text-muted)', fontSize: 12, fontWeight: expiring ? 700 : 400 }}>
                        {(t.contract?.expiresInWeeks || 0) > 0 ? `${t.contract.expiresInWeeks}w` : '—'}
                        {expiring && ' ⚠'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isInjured
                        ? <span className="badge badge-red">INJURED {Math.ceil(daysOut / 7)}w</span>
                        : <span className="badge badge-green">ACTIVE</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤼</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              {roster.length === 0 ? 'No talent on roster' : 'No results'}
            </div>
            <div style={{ fontSize: 13 }}>
              {roster.length === 0
                ? 'Negotiate contracts with free agents to build your roster.'
                : 'Try a different search or filter.'}
            </div>
          </div>
        )}
      </div>

      {/* Read-only profile modal */}
      {selected && <TalentProfile talent={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
