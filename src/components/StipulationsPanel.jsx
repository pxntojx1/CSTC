import { useState } from 'react';
import useGameStore from '../store/gameStore';

const RISK_COLOR = (r) => r <= 3 ? '#4caf50' : r <= 6 ? '#c9a84c' : '#cc2200';
const DRAW_COLOR = (d) => d <= 3 ? '#888' : d <= 6 ? '#4fc3f7' : '#c9a84c';

function RangeBar({ value, max = 10, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ color, fontSize: 13, width: 20, textAlign: 'right', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function EditModal({ stip, onSave, onClose }) {
  const [form, setForm] = useState({ ...stip });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: 32, width: 400 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#c9a84c', marginBottom: 20 }}>
          {stip.id ? 'EDIT STIPULATION' : 'NEW STIPULATION'}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>Name</label>
          <input
            value={form.name || ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Steel Cage Match"
            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px 10px', color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>
            Risk Level: <span style={{ color: RISK_COLOR(form.risk || 0) }}>{form.risk || 0}/10</span>
          </label>
          <input
            type="range" min={0} max={10} value={form.risk || 0}
            onChange={e => setForm(f => ({ ...f, risk: +e.target.value }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: 11, marginTop: 2 }}>
            <span>No risk</span><span>Extreme risk</span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>
            Drawing Power: <span style={{ color: DRAW_COLOR(form.drawingPower || 0) }}>{form.drawingPower || 0}/10</span>
          </label>
          <input
            type="range" min={0} max={10} value={form.drawingPower || 0}
            onChange={e => setForm(f => ({ ...f, drawingPower: +e.target.value }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444', fontSize: 11, marginTop: 2 }}>
            <span>Low draw</span><span>High draw</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { if (form.name?.trim()) { onSave(form); onClose(); } }}
            style={{ flex: 1, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}
          >SAVE</button>
          <button onClick={onClose} style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: '10px 16px', color: '#888', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function StipulationsPanel() {
  const { stipulations, setStipulations, importStipulations } = useGameStore();
  const [editing, setEditing] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState(1);

  const allStips = stipulations;

  const handleSave = (form) => {
    const newStip = { ...form, id: form.id || `stip-${Date.now()}` };
    const next = allStips.find(s => s.id === newStip.id)
      ? allStips.map(s => s.id === newStip.id ? newStip : s)
      : [...allStips, newStip];
    setStipulations(next);
  };

  const handleDelete = (id) => {
    setStipulations(allStips.filter(s => s.id !== id));
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      importStipulations(data);
    } catch {}
    e.target.value = '';
  };

  const sorted = [...allStips].sort((a, b) => {
    let va, vb;
    if (sortKey === 'name') { va = a.name; vb = b.name; }
    else if (sortKey === 'risk') { va = a.risk; vb = b.risk; }
    else { va = a.drawingPower; vb = b.drawingPower; }
    return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
  });

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => -d);
    else { setSortKey(k); setSortDir(1); }
  };

  const SortHeader = ({ label, k, align = 'left' }) => (
    <th
      onClick={() => toggleSort(k)}
      style={{ cursor: 'pointer', padding: '10px 14px', color: sortKey === k ? '#c9a84c' : '#666', textAlign: align, userSelect: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2 }}>STIPULATIONS</div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 2 }}>{allStips.length} match type{allStips.length !== 1 ? 's' : ''} defined</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{
            background: '#1a1a1a', border: '1px solid #444', borderRadius: 8,
            padding: '8px 16px', color: '#888', cursor: 'pointer', fontSize: 14
          }}>
            Import JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button
            onClick={() => setEditing({ name: '', risk: 0, drawingPower: 0 })}
            style={{ background: '#c9a84c', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}
          >+ NEW</button>
        </div>
      </div>

      {allStips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#333' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#555', marginBottom: 8 }}>NO STIPULATIONS</div>
          <div style={{ fontSize: 14, color: '#444' }}>
            Import a stipulations JSON or create them manually.<br />
            Stipulations affect match ratings and injury risk.
          </div>
        </div>
      ) : (
        <>
          {/* Quick-reference cards for common types */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
            {sorted.slice(0, 6).map(s => (
              <div key={s.id} style={{
                background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, padding: '14px 16px',
                cursor: 'pointer', transition: 'border-color 0.15s'
              }}
                onClick={() => setEditing(s)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
              >
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#e0e0e0', marginBottom: 10 }}>{s.name}</div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Risk</div>
                  <RangeBar value={s.risk} color={RISK_COLOR(s.risk)} />
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Drawing Power</div>
                  <RangeBar value={s.drawingPower} color={DRAW_COLOR(s.drawingPower)} />
                </div>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: '#111', borderBottom: '1px solid #2a2a2a' }}>
                <tr>
                  <SortHeader label="Name" k="name" />
                  <SortHeader label="Risk" k="risk" align="center" />
                  <SortHeader label="Drawing Power" k="drawingPower" align="center" />
                  <th style={{ padding: '10px 14px', color: '#555', fontSize: 11, textAlign: 'center', textTransform: 'uppercase' }}>Injury Chance</th>
                  <th style={{ padding: '10px 14px', color: '#555', fontSize: 11, textAlign: 'right', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid #1a1a1a', background: i % 2 === 0 ? 'transparent' : '#161616' }}
                  >
                    <td style={{ padding: '12px 14px', color: '#e0e0e0', fontWeight: 500 }}>{s.name}</td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: RISK_COLOR(s.risk), fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{s.risk}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} style={{ width: 5, height: 5, borderRadius: 1, background: j < s.risk ? RISK_COLOR(s.risk) : '#2a2a2a' }} />
                          ))}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: DRAW_COLOR(s.drawingPower), fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{s.drawingPower}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div key={j} style={{ width: 5, height: 5, borderRadius: 1, background: j < s.drawingPower ? DRAW_COLOR(s.drawingPower) : '#2a2a2a' }} />
                          ))}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'center', color: RISK_COLOR(s.risk), fontSize: 13 }}>
                      {((s.risk / 10) * 3).toFixed(1)}%
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setEditing(s)}
                          style={{ background: '#222', border: '1px solid #333', borderRadius: 5, padding: '4px 12px', color: '#c9a84c', cursor: 'pointer', fontSize: 12 }}
                        >Edit</button>
                        <button
                          onClick={() => { if (window.confirm(`Delete "${s.name}"?`)) handleDelete(s.id); }}
                          style={{ background: 'none', border: '1px solid #3a1a1a', borderRadius: 5, padding: '4px 10px', color: '#cc2200', cursor: 'pointer', fontSize: 12 }}
                        >✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <EditModal
          stip={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
