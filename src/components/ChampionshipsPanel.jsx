import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { getChampionNames } from '../engine/championships';
import { parseISO, differenceInDays, format } from 'date-fns';

function StarBar({ value, max = 10 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < Math.round(value) ? '#c9a84c' : '#2a2a2a' }} />
      ))}
    </div>
  );
}

function HistoryModal({ championship, roster, onClose }) {
  const history = championship.history || [];

  const champCounts = {};
  for (const reign of history) {
    const ids = Array.isArray(reign.championId) ? reign.championId : [reign.championId];
    for (const id of ids) {
      champCounts[id] = (champCounts[id] || 0) + 1;
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #c9a84c', borderRadius: 12, padding: 32, maxWidth: 800, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#c9a84c' }}>{championship.name}</div>
            <div style={{ color: '#888', fontSize: 13 }}>Championship History</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        {history.length === 0 ? (
          <div style={{ color: '#444', fontSize: 14, textAlign: 'center', padding: 40 }}>No title history yet</div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#666', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Champion(s)</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Won At</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Date Won</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Lost At</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Date Lost</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px' }}>Days</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px' }}>Def.</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((reign, idx) => {
                  const isCurrent = !reign.lostAt;
                  const ids = Array.isArray(reign.championId) ? reign.championId : [reign.championId];
                  const names = ids.map(id => roster.find(t => t.id === id)?.name || reign.championName || 'Unknown').join(' & ');
                  return (
                    <tr key={idx} style={{
                      borderBottom: '1px solid #222',
                      background: isCurrent ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}>
                      <td style={{ padding: '10px', color: '#555' }}>{reign.reignNumber}</td>
                      <td style={{ padding: '10px', color: isCurrent ? '#c9a84c' : '#e0e0e0', fontWeight: isCurrent ? 700 : 400 }}>
                        {names}
                        {isCurrent && <span style={{ color: '#c9a84c', fontSize: 10, marginLeft: 6 }}>★ CURRENT</span>}
                      </td>
                      <td style={{ padding: '10px', color: '#888' }}>{reign.wonAt?.showName || '—'}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{reign.wonAt?.date || '—'}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{reign.lostAt?.showName || '—'}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{reign.lostAt?.date || '—'}</td>
                      <td style={{ textAlign: 'center', padding: '10px', color: '#888' }}>{reign.reignLengthDays ?? '—'}</td>
                      <td style={{ textAlign: 'center', padding: '10px', color: '#888' }}>{reign.defenses || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaderboard */}
        {Object.keys(champCounts).length > 0 && (
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#c9a84c', marginBottom: 12 }}>MOST REIGNS</div>
            {Object.entries(champCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => {
                const name = roster.find(t => t.id === id)?.name || id;
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: '#e0e0e0' }}>{name}</span>
                    <span style={{ color: '#c9a84c', fontFamily: 'Anton, sans-serif' }}>{count}x</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateChampModal({ onClose }) {
  const { createChampionship } = useGameStore();
  const [form, setForm] = useState({ name: '', type: 'singles', prestigeLevel: 5, image: '' });

  const submit = () => {
    if (!form.name) return;
    createChampionship(form);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: 32, width: 420 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#c9a84c', marginBottom: 20 }}>CREATE CHAMPIONSHIP</div>

        {[
          { label: 'Championship Name', key: 'name', type: 'text' },
          { label: 'Image URL (optional)', key: 'image', type: 'text' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px', color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px', color: '#e0e0e0', fontSize: 13 }}
          >
            <option value="singles">Singles</option>
            <option value="tag">Tag Team</option>
            <option value="trios">Trios</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>Prestige Level: {form.prestigeLevel}</label>
          <input type="range" min={1} max={10} value={form.prestigeLevel} onChange={e => setForm(f => ({ ...f, prestigeLevel: +e.target.value }))}
            style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={submit} style={{ flex: 1, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}>CREATE</button>
          <button onClick={onClose} style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 16px', color: '#888', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ChampionshipsPanel() {
  const { championships, roster, importChampionships, currentDate } = useGameStore();
  const [historyChamp, setHistoryChamp] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const fileRef = { current: null };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importChampionships(JSON.parse(text));
    } catch {}
    e.target.value = '';
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2 }}>CHAMPIONSHIPS</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: 8, padding: '8px 16px', color: '#888', cursor: 'pointer', fontSize: 14 }}>
            Import JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button onClick={() => setShowCreate(true)}
            style={{ background: '#c9a84c', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}
          >+ CREATE</button>
        </div>
      </div>

      {championships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, marginTop: 10 }}>NO CHAMPIONSHIPS</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Create or import championships to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {championships.map(c => {
            const champName = getChampionNames(c, roster);
            const daysIntoReign = c.dateWon && c.currentChampion
              ? differenceInDays(parseISO(currentDate), parseISO(c.dateWon))
              : null;
            const currentChampTalent = c.currentChampion
              ? (Array.isArray(c.currentChampion) ? c.currentChampion.map(id => roster.find(t => t.id === id)) : [roster.find(t => t.id === c.currentChampion)]).filter(Boolean)
              : [];
            const avgSP = currentChampTalent.length
              ? currentChampTalent.reduce((s, t) => s + (t.starPower || 0), 0) / currentChampTalent.length
              : 0;

            return (
              <div key={c.id} style={{ background: '#1a1a1a', border: `1px solid ${c.currentChampion ? '#2a2a2a' : '#440000'}`, borderRadius: 10, padding: 20, cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => setHistoryChamp(c)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                onMouseLeave={e => e.currentTarget.style.borderColor = c.currentChampion ? '#2a2a2a' : '#440000'}
              >
                {c.image && <img src={c.image} alt={c.name} style={{ width: '100%', maxHeight: 120, objectFit: 'contain', marginBottom: 12 }} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c' }}>{c.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ background: '#1a2a3a', color: '#4fc3f7', fontSize: 11, padding: '2px 8px', borderRadius: 3, textTransform: 'uppercase' }}>{c.type}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#555', fontSize: 11, marginBottom: 6 }}>PRESTIGE</div>
                  <StarBar value={c.prestigeLevel} />
                </div>

                {champName ? (
                  <div style={{ background: '#111', borderRadius: 6, padding: 10 }}>
                    <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>CURRENT CHAMPION</div>
                    <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>{champName}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: '#ffd700', fontSize: 13 }}>{'★'.repeat(Math.floor(avgSP))}</span>
                      {daysIntoReign != null && <span style={{ color: '#555', fontSize: 12 }}>{daysIntoReign} days</span>}
                    </div>
                    <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                      {(c.history?.slice(-1)[0]?.defenses || 0)} defense(s)
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#3a0000', borderRadius: 6, padding: 10, textAlign: 'center' }}>
                    <span style={{ color: '#cc2200', fontFamily: 'Anton, sans-serif', fontSize: 16 }}>VACANT</span>
                  </div>
                )}

                <div style={{ color: '#555', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
                  {(c.history || []).length} reign(s) — Click for history
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historyChamp && <HistoryModal championship={historyChamp} roster={roster} onClose={() => setHistoryChamp(null)} />}
      {showCreate && <CreateChampModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
