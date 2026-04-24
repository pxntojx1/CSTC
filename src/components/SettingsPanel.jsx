import { useState, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { defaultStipulations, defaultSponsors, defaultTVDeals } from '../data/defaults';

const SECTION = ({ title, sub, children }) => (
  <div className="card" style={{ padding: 24, marginBottom: 20 }}>
    <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 17, color: 'var(--text)', letterSpacing: 0.5 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

function ImportRow({ label, description, onImport, onReset, resetLabel }) {
  const ref = useRef();
  const [status, setStatus] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        onImport(Array.isArray(data) ? data : [data]);
        setStatus({ ok: true, msg: `✓ Imported ${Array.isArray(data) ? data.length : 1} items` });
      } catch {
        setStatus({ ok: false, msg: '✕ Invalid JSON file' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        {status && (
          <div style={{ fontSize: 12, marginTop: 4, color: status.ok ? 'var(--primary-d)' : 'var(--danger)' }}>
            {status.msg}
          </div>
        )}
      </div>
      <input type="file" accept=".json" ref={ref} onChange={handleFile} style={{ display: 'none' }} />
      {onReset && (
        <button onClick={onReset} className="btn btn-ghost" style={{ fontSize: 12 }}>
          {resetLabel || 'Reset'}
        </button>
      )}
      <button onClick={() => ref.current?.click()} className="btn btn-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        Import JSON
      </button>
    </div>
  );
}

export default function SettingsPanel() {
  const {
    company, gameName, updateCompany,
    importTalentToPool, importStipulations, setStipulations,
    importSponsors, setSponsors, importTVDeals, setTVDeals,
    importChampionships,
  } = useGameStore();

  const [companyForm, setCompanyForm] = useState({
    name: company.name,
    logo: company.logo || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSaveCompany = () => {
    updateCompany({ name: companyForm.name, logo: companyForm.logo || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const FIELD = { width: '100%', marginBottom: 12 };
  const LABEL = { display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 };

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Settings</div>
        <div className="section-sub">Game: {gameName || '—'}</div>
      </div>

      {/* Company Info */}
      <SECTION title="COMPANY" sub="Edit your promotion's name and logo.">
        <div style={FIELD}>
          <label style={LABEL}>Company Name</label>
          <input type="text" value={companyForm.name}
            onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div style={FIELD}>
          <label style={LABEL}>Logo URL</label>
          <input type="text" value={companyForm.logo}
            onChange={e => setCompanyForm(f => ({ ...f, logo: e.target.value }))}
            placeholder="https://..." />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSaveCompany} className="btn btn-primary">
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </SECTION>

      {/* Data Imports */}
      <SECTION title="IMPORT DATA" sub="Load custom JSON files to replace or augment the pre-loaded defaults.">
        <ImportRow
          label="Talent → Free Agent Pool"
          description="Wrestlers, managers, announcers, referees. Imported talent goes to the free agent pool — negotiate contracts in the Free Agents panel."
          onImport={importTalentToPool}
        />
        <ImportRow
          label="Stipulations"
          description="Match types with risk and drawing power ratings."
          onImport={importStipulations}
          onReset={() => setStipulations(defaultStipulations)}
          resetLabel="Reset to Defaults"
        />
        <ImportRow
          label="Sponsors"
          description="Sponsorship deals with follower requirements and annual payments."
          onImport={importSponsors}
          onReset={() => setSponsors(defaultSponsors)}
          resetLabel="Reset to Defaults"
        />
        <ImportRow
          label="TV / Media Deals"
          description="Broadcasting deals from local access to national TV."
          onImport={importTVDeals}
          onReset={() => setTVDeals(defaultTVDeals)}
          resetLabel="Reset to Defaults"
        />
        <ImportRow
          label="Championships"
          description="Championship titles with prestige levels and current champions."
          onImport={importChampionships}
        />
        <div style={{ paddingTop: 8, fontSize: 12, color: 'var(--text-faint)' }}>
          📁 Template JSON files are in the <code>/templates</code> folder of the project.
        </div>
      </SECTION>

      {/* Game Data Reset */}
      <SECTION title="DANGER ZONE" sub="Irreversible actions — be careful.">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'var(--danger-lt)',
          border: '1px solid #fca5a5', borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>Reset All Game Data</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>
              Erases your entire save and returns to the main menu.
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('This will permanently erase all game data. Are you sure?')) {
                useGameStore.getState().resetGame();
              }
            }}
            className="btn btn-danger"
          >
            Reset Game
          </button>
        </div>
      </SECTION>
    </div>
  );
}
