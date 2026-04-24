import { useState, useRef } from 'react';
import useGameStore from '../store/gameStore';

const PRESET_COMPANIES = [
  {
    id: 'preset-small',
    label: 'Indie Startup',
    description: 'Scrappy local promotion. Tight budget, big dreams.',
    emoji: '🏠',
    data: { name: 'Indie Uprising Wrestling', funds: 50_000, followers: 800 },
  },
  {
    id: 'preset-mid',
    label: 'Regional Powerhouse',
    description: 'Established regional fed with a loyal fanbase.',
    emoji: '📺',
    data: { name: 'Heartland Championship Wrestling', funds: 250_000, followers: 22_000 },
  },
  {
    id: 'preset-major',
    label: 'Major Promotion',
    description: 'National brand. Big stars, bigger expectations.',
    emoji: '🌟',
    data: { name: 'Supreme Wrestling Federation', funds: 1_200_000, followers: 180_000 },
  },
];

const DEFAULT_COMPANY = {
  name: '',
  funds: 100_000,
  followers: 2_000,
  logo: '',
};

const FIELD_STYLE = {
  width: '100%', padding: '10px 12px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: 8, color: '#f1f5f9', fontSize: 14,
  outline: 'none', fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
};

const LABEL_STYLE = {
  display: 'block', color: '#94a3b8', fontSize: 12,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600,
};

function Step1({ gameName, setGameName, onNext, onCancel }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#f1f5f9', letterSpacing: 1 }}>
          NEW GAME
        </div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Give your save file a name to get started.
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={LABEL_STYLE}>Save Name</label>
        <input
          type="text"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          placeholder="e.g. My First Season"
          style={FIELD_STYLE}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px 0', borderRadius: 8,
          background: 'transparent', border: '1px solid #334155',
          color: '#64748b', cursor: 'pointer', fontSize: 14,
        }}>Back</button>
        <button
          onClick={onNext}
          disabled={!gameName.trim()}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 8,
            background: gameName.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : '#1e293b',
            border: 'none', color: gameName.trim() ? '#fff' : '#475569',
            cursor: gameName.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: 1,
          }}
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}

function Step2({ selectedPreset, setSelectedPreset, customCompany, setCustomCompany, onNext, onBack, jsonFileRef }) {
  const [mode, setMode] = useState('preset'); // 'preset' | 'custom' | 'json'
  const [jsonError, setJsonError] = useState('');

  const handleJsonLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const company = Array.isArray(data) ? data[0] : data;
        setCustomCompany({
          name: company.name || '',
          funds: company.funds ?? 100_000,
          followers: company.followers ?? 2_000,
          logo: company.logo || '',
        });
        setSelectedPreset(null);
        setMode('custom');
        setJsonError('');
      } catch {
        setJsonError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const effectiveCompany = selectedPreset
    ? PRESET_COMPANIES.find(p => p.id === selectedPreset)?.data
    : customCompany;

  const canContinue = selectedPreset || (customCompany.name.trim());

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: '#f1f5f9', letterSpacing: 1 }}>
          YOUR PROMOTION
        </div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Choose a preset or create your own.
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0f172a', borderRadius: 8, padding: 4 }}>
        {[['preset','Presets'],['custom','Custom'],['json','Import JSON']].map(([id,label]) => (
          <button key={id} onClick={() => { setMode(id); if (id !== 'custom') setSelectedPreset(null); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              background: mode === id ? '#1e293b' : 'transparent',
              color: mode === id ? '#10b981' : '#64748b',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'preset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {PRESET_COMPANIES.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPreset(p.id); setCustomCompany(DEFAULT_COMPANY); }}
              style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                background: selectedPreset === p.id ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                border: selectedPreset === p.id ? '1px solid rgba(16,185,129,0.4)' : '1px solid #1e293b',
                transition: 'all 0.15s',
                display: 'flex', gap: 14, alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 28 }}>{p.emoji}</span>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{p.description}</div>
                <div style={{ color: '#10b981', fontSize: 11, marginTop: 4 }}>
                  ${(p.data.funds / 1000).toFixed(0)}K · {p.data.followers.toLocaleString()} followers
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={LABEL_STYLE}>Company Name *</label>
            <input type="text" value={customCompany.name}
              onChange={e => { setCustomCompany(c => ({ ...c, name: e.target.value })); setSelectedPreset(null); }}
              placeholder="e.g. Thunderstorm Wrestling Alliance" style={FIELD_STYLE} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Starting Funds ($)</label>
              <input type="number" min={0} step={1000} value={customCompany.funds}
                onChange={e => setCustomCompany(c => ({ ...c, funds: Number(e.target.value) }))}
                style={FIELD_STYLE} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Followers</label>
              <input type="number" min={0} step={100} value={customCompany.followers}
                onChange={e => setCustomCompany(c => ({ ...c, followers: Number(e.target.value) }))}
                style={FIELD_STYLE} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Logo URL (optional)</label>
            <input type="text" value={customCompany.logo}
              onChange={e => setCustomCompany(c => ({ ...c, logo: e.target.value }))}
              placeholder="https://..." style={FIELD_STYLE} />
          </div>
        </div>
      )}

      {mode === 'json' && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            border: '2px dashed #334155', borderRadius: 10, padding: 32, textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              Upload your <code style={{ color: '#10b981' }}>company.json</code> file
            </div>
            <input type="file" accept=".json" ref={jsonFileRef} onChange={handleJsonLoad} style={{ display: 'none' }} />
            <button onClick={() => jsonFileRef.current?.click()} style={{
              padding: '10px 20px', borderRadius: 8, background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer', fontSize: 13,
            }}>
              Choose File
            </button>
            {jsonError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 10 }}>{jsonError}</div>}
            {mode === 'json' && customCompany.name && (
              <div style={{ color: '#10b981', fontSize: 12, marginTop: 10 }}>
                ✓ Loaded: {customCompany.name}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '12px 0', borderRadius: 8,
          background: 'transparent', border: '1px solid #334155',
          color: '#64748b', cursor: 'pointer', fontSize: 14,
        }}>← Back</button>
        <button
          onClick={() => onNext(effectiveCompany)}
          disabled={!canContinue}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 8,
            background: canContinue ? 'linear-gradient(135deg, #10b981, #059669)' : '#1e293b',
            border: 'none', color: canContinue ? '#fff' : '#475569',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: 1,
          }}
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}

function Step3({ onBack, onStart }) {
  const [talentFile,  setTalentFile]  = useState(null);
  const [talentData,  setTalentData]  = useState([]);
  const [champFile,   setChampFile]   = useState(null);
  const [champData,   setChampData]   = useState([]);
  const [errors,      setErrors]      = useState({});
  const talentRef = useRef();
  const champRef  = useRef();

  const loadJson = (e, key, setter, setFile) => {
    const file = e.target.files[0];
    if (!file) return;
    setFile(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setter(Array.isArray(data) ? data : [data]);
        setErrors(err => ({ ...err, [key]: null }));
      } catch {
        setErrors(err => ({ ...err, [key]: 'Invalid JSON' }));
        setFile(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: '#f1f5f9', letterSpacing: 1 }}>
          READY TO START
        </div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          These defaults are pre-loaded for every new game.
        </div>
      </div>

      {/* Pre-loaded defaults summary */}
      <div style={{ marginBottom: 20 }}>
        {[
          { icon: '⚔️', label: '15 Stipulations', sub: 'Standard, Ladder, Cage, TLC, Iron Man…' },
          { icon: '💰', label: '7 Sponsors',       sub: 'Local gym to national tech brands' },
          { icon: '📺', label: '7 TV / Media Deals', sub: 'Public access to national primetime' },
        ].map(({ icon, label, sub }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', marginBottom: 8,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
              <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>✓ {label}</div>
              <div style={{ color: '#475569', fontSize: 11 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Optional imports */}
      <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 10 }}>
        Optional: Load your own data
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {/* Talent */}
        {[
          { label: 'Talent Pool', sub: 'Wrestlers, managers, announcers — goes to Free Agents', ref: talentRef, file: talentFile, data: talentData, key: 'talent', setter: setTalentData, setFile: setTalentFile },
          { label: 'Championships', sub: 'Title belts with prestige levels', ref: champRef, file: champFile, data: champData, key: 'champ', setter: setChampData, setFile: setChampFile },
        ].map(({ label, sub, ref, file, data, key, setter, setFile }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px',
            background: data.length ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${data.length ? 'rgba(16,185,129,0.3)' : '#1e293b'}`,
            borderRadius: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{label}</div>
              {file
                ? <div style={{ color: '#10b981', fontSize: 11, marginTop: 2 }}>✓ {file} — {data.length} items loaded</div>
                : <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{sub}</div>
              }
              {errors[key] && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{errors[key]}</div>}
            </div>
            <input type="file" accept=".json" ref={ref} onChange={e => loadJson(e, key, setter, setFile)} style={{ display: 'none' }} />
            <button onClick={() => ref.current?.click()} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981', whiteSpace: 'nowrap',
            }}>
              {file ? 'Change' : 'Load JSON'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
        💡 More data (extra stipulations, sponsors, TV deals) can be imported any time from <strong style={{ color: '#94a3b8' }}>Settings → Import Data</strong>.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '12px 0', borderRadius: 8,
          background: 'transparent', border: '1px solid #334155',
          color: '#64748b', cursor: 'pointer', fontSize: 14,
        }}>← Back</button>
        <button
          onClick={() => onStart({ talentData, champData })}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 8,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: '#fff',
            cursor: 'pointer', fontFamily: 'Anton, sans-serif', fontSize: 16, letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
          }}
        >
          START GAME 🚀
        </button>
      </div>
    </div>
  );
}

export default function NewGameWizard({ onCancel }) {
  const [step, setStep]           = useState(1);
  const [gameName, setGameName]   = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customCompany, setCustomCompany]   = useState(DEFAULT_COMPANY);
  const [companyData, setCompanyData]       = useState(null);
  const jsonFileRef = useRef();

  const { startNewGame, importTalentToPool, importChampionships } = useGameStore();

  const handleStep2Next = (company) => {
    setCompanyData(company);
    setStep(3);
  };

  const handleStart = ({ talentData, champData }) => {
    startNewGame({ gameName: gameName.trim() || 'My Game', company: companyData });
    if (talentData.length)  importTalentToPool(talentData);
    if (champData.length)   importChampionships(champData);
    // App will now render because initialized = true
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: 20, padding: 40,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              width: n === step ? 32 : 8, height: 8, borderRadius: 99,
              background: n <= step ? '#10b981' : '#334155',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <Step1
            gameName={gameName} setGameName={setGameName}
            onNext={() => setStep(2)} onCancel={onCancel}
          />
        )}
        {step === 2 && (
          <Step2
            selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset}
            customCompany={customCompany} setCustomCompany={setCustomCompany}
            onNext={handleStep2Next} onBack={() => setStep(1)}
            jsonFileRef={jsonFileRef}
          />
        )}
        {step === 3 && (
          <Step3
            onBack={() => setStep(2)}
            onStart={handleStart}
          />
        )}
      </div>
    </div>
  );
}
