import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency } from '../engine/utils';

function CreateProgramModal({ onClose }) {
  const { createDevelopmentProgram } = useGameStore();
  const [form, setForm] = useState({ name: '', type: 'Combat', capacity: 5, weeklyCost: 500, duration: 12, growthPerWeek: 2 });

  const submit = () => {
    if (!form.name) return;
    createDevelopmentProgram(form);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: 32, width: 440 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#c9a84c', marginBottom: 20 }}>CREATE PROGRAM</div>

        {[
          { label: 'Program Name', key: 'name', type: 'text' },
          { label: 'Weekly Cost ($)', key: 'weeklyCost', type: 'number' },
          { label: 'Capacity (max wrestlers)', key: 'capacity', type: 'number' },
          { label: 'Duration (weeks)', key: 'duration', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px', color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px', color: '#e0e0e0', fontSize: 13 }}
          >
            <option value="Combat">Combat (improves wrestling skills)</option>
            <option value="Entertainment">Entertainment (improves mic/acting)</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>Growth Per Week: +{form.growthPerWeek}</label>
          <input type="range" min={1} max={3} value={form.growthPerWeek} onChange={e => setForm(f => ({ ...f, growthPerWeek: +e.target.value }))}
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

function AssignModal({ program, onClose }) {
  const { roster, updateProgram } = useGameStore();
  const wrestlers = roster.filter(t => t.type === 'wrestler');
  const assigned = program.assignedTalent || [];

  const toggle = (id) => {
    const next = assigned.includes(id)
      ? assigned.filter(x => x !== id)
      : assigned.length < program.capacity ? [...assigned, id] : assigned;
    updateProgram(program.id, { assignedTalent: next });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: 32, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#c9a84c' }}>ASSIGN TO {program.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
          {assigned.length}/{program.capacity} slots filled
        </div>
        {wrestlers.map(t => {
          const isAssigned = assigned.includes(t.id);
          const isFull = assigned.length >= program.capacity && !isAssigned;
          return (
            <div key={t.id} onClick={() => !isFull && toggle(t.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', marginBottom: 8, borderRadius: 6,
                background: isAssigned ? '#1a3a1a' : '#111',
                border: `1px solid ${isAssigned ? '#4caf50' : '#222'}`,
                cursor: isFull ? 'not-allowed' : 'pointer',
                opacity: isFull ? 0.5 : 1,
              }}
            >
              <span style={{ color: '#e0e0e0' }}>{t.name}</span>
              {isAssigned && <span style={{ color: '#4caf50', fontSize: 12 }}>✓ Assigned</span>}
            </div>
          );
        })}
        <button onClick={onClose} style={{ width: '100%', marginTop: 12, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}>DONE</button>
      </div>
    </div>
  );
}

export default function DevelopmentPanel() {
  const { developmentPrograms, roster, updateProgram, deleteProgram } = useGameStore();
  const [showCreate, setShowCreate] = useState(false);
  const [assigning, setAssigning] = useState(null);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2 }}>DEVELOPMENT</div>
        <button onClick={() => setShowCreate(true)}
          style={{ background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}
        >+ CREATE PROGRAM</button>
      </div>

      {developmentPrograms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
          <div style={{ fontSize: 20, fontFamily: 'Anton, sans-serif' }}>NO PROGRAMS</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Create training programs to develop your roster</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {developmentPrograms.map(prog => {
            const assignedTalent = (prog.assignedTalent || []).map(id => roster.find(t => t.id === id)).filter(Boolean);
            const progress = prog.duration ? prog.weeksElapsed / prog.duration : 0;
            const typeColor = prog.type === 'Combat' ? '#c9a84c' : '#9c27b0';

            return (
              <div key={prog.id} style={{ background: '#1a1a1a', border: `1px solid ${typeColor}33`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#e0e0e0' }}>{prog.name}</div>
                    <span style={{ background: typeColor + '22', color: typeColor, fontSize: 11, padding: '2px 8px', borderRadius: 3 }}>{prog.type}</span>
                  </div>
                  <button onClick={() => { if (confirm('Delete this program?')) deleteProgram(prog.id); }}
                    style={{ background: 'none', border: 'none', color: '#cc2200', cursor: 'pointer', fontSize: 18 }}
                  >✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, fontSize: 13 }}>
                  <div style={{ background: '#111', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#555', fontSize: 11 }}>Weekly Cost</div>
                    <div style={{ color: '#cc2200' }}>{formatCurrency(prog.weeklyCost)}</div>
                  </div>
                  <div style={{ background: '#111', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#555', fontSize: 11 }}>Growth/Week</div>
                    <div style={{ color: '#4caf50' }}>+{prog.growthPerWeek} pts</div>
                  </div>
                  <div style={{ background: '#111', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#555', fontSize: 11 }}>Enrolled</div>
                    <div style={{ color: '#e0e0e0' }}>{assignedTalent.length}/{prog.capacity}</div>
                  </div>
                  <div style={{ background: '#111', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#555', fontSize: 11 }}>Progress</div>
                    <div style={{ color: '#888' }}>{prog.weeksElapsed}/{prog.duration || '∞'}w</div>
                  </div>
                </div>

                {prog.duration && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: '#222', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(progress, 1) * 100}%`, background: typeColor, borderRadius: 3 }} />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  {assignedTalent.map(t => (
                    <span key={t.id} style={{ display: 'inline-block', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '2px 8px', margin: '2px', fontSize: 12, color: '#888' }}>
                      {t.name}
                    </span>
                  ))}
                </div>

                <button onClick={() => setAssigning(prog)}
                  style={{ width: '100%', background: '#111', border: `1px solid ${typeColor}`, borderRadius: 6, padding: '8px', color: typeColor, cursor: 'pointer', fontSize: 14 }}
                >MANAGE ROSTER</button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateProgramModal onClose={() => setShowCreate(false)} />}
      {assigning && <AssignModal program={assigning} onClose={() => setAssigning(null)} />}
    </div>
  );
}
