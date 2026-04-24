import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency, formatFollowers } from '../engine/utils';

export default function CompanyPanel() {
  const { company, updateCompany, importTalent, importStipulations, importSponsors, importTVDeals, importChampionships, importCompany } = useGameStore();
  const [form, setForm] = useState({ ...company });
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateCompany(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = (fn) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      fn(data);
    } catch {}
    e.target.value = '';
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2, marginBottom: 24 }}>COMPANY</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 24 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c', marginBottom: 20 }}>COMPANY INFO</div>

          {[
            { label: 'Company Name', key: 'name', type: 'text' },
            { label: 'Logo URL (optional)', key: 'logo', type: 'text' },
            { label: 'Starting Funds ($)', key: 'funds', type: 'number' },
            { label: 'Followers', key: 'followers', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={form[key] ?? ''}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 4, padding: '8px 10px', color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <button onClick={save} style={{ width: '100%', background: saved ? '#2a7a2a' : '#c9a84c', border: 'none', borderRadius: 8, padding: '10px', color: saved ? '#fff' : '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer', transition: 'background 0.3s' }}>
            {saved ? '✓ SAVED' : 'SAVE CHANGES'}
          </button>
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 24 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c', marginBottom: 20 }}>STATS</div>
          {[
            { label: 'Funds', value: formatCurrency(company.funds), color: company.funds < 0 ? '#cc2200' : '#4caf50' },
            { label: 'Followers', value: formatFollowers(company.followers), color: '#4fc3f7' },
            { label: 'Negative Months Streak', value: company.negativeFundsStreak || 0, color: company.negativeFundsStreak >= 3 ? '#cc2200' : '#888' },
            { label: 'Status', value: company.isBankrupt ? 'BANKRUPT' : 'Operating', color: company.isBankrupt ? '#cc2200' : '#4caf50' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, borderBottom: '1px solid #222', paddingBottom: 10 }}>
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ color, fontFamily: 'Anton, sans-serif', fontSize: 16 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Re-import section */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: 24, marginTop: 20 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c', marginBottom: 16 }}>RE-IMPORT DATA</div>
        <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>Import additional JSON files to merge with existing data</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { label: '🤼 Talent', fn: importTalent },
            { label: '⚔️ Stipulations', fn: importStipulations },
            { label: '🏢 Company', fn: importCompany },
            { label: '💰 Sponsors', fn: importSponsors },
            { label: '📺 TV Deals', fn: importTVDeals },
            { label: '🏆 Championships', fn: importChampionships },
          ].map(({ label, fn }) => (
            <label key={label} style={{ display: 'block', background: '#111', border: '1px solid #333', borderRadius: 6, padding: '10px 14px', cursor: 'pointer', color: '#888', fontSize: 14, textAlign: 'center' }}>
              {label}
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport(fn)} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
