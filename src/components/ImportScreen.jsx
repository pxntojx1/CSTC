import { useState, useRef } from 'react';
import useGameStore from '../store/gameStore';

function FileImportCard({ label, description, onImport, color = '#c9a84c' }) {
  const ref = useRef();
  const [status, setStatus] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      onImport(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
    e.target.value = '';
  };

  return (
    <div style={{
      background: '#1a1a1a',
      border: `1px solid ${status === 'success' ? '#2a7a2a' : status === 'error' ? '#cc2200' : '#333'}`,
      borderRadius: 8,
      padding: '20px',
      cursor: 'pointer',
      transition: 'border-color 0.2s',
    }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
      <div style={{ color, fontFamily: 'Anton, sans-serif', fontSize: 18, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#888', fontSize: 13 }}>{description}</div>
      {status === 'success' && <div style={{ color: '#2a7a2a', marginTop: 8, fontSize: 13 }}>✓ Imported successfully</div>}
      {status === 'error' && <div style={{ color: '#cc2200', marginTop: 8, fontSize: 13 }}>✗ Invalid JSON file</div>}
      <div style={{
        marginTop: 12,
        background: '#111',
        border: '1px dashed #444',
        borderRadius: 4,
        padding: '8px 12px',
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
      }}>
        Click to browse for JSON file
      </div>
    </div>
  );
}

export default function ImportScreen({ onComplete }) {
  const { importTalent, importStipulations, importCompany, importSponsors, importTVDeals, importChampionships, markInitialized } = useGameStore();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 48, color: '#c9a84c', letterSpacing: 4 }}>
          PRO WRESTLING BOOKING
        </div>
        <div style={{ color: '#666', marginTop: 8, fontSize: 16 }}>
          Import your data files to begin — or skip to start fresh
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        maxWidth: 900,
        width: '100%',
      }}>
        <FileImportCard
          label="🤼 Talent Roster"
          description="Import wrestlers, announcers, referees, and managers"
          onImport={importTalent}
        />
        <FileImportCard
          label="⚔️ Stipulations"
          description="Match types with risk and drawing power values"
          onImport={importStipulations}
          color="#e0e0e0"
        />
        <FileImportCard
          label="🏢 Company"
          description="Pre-load your wrestling company data"
          onImport={importCompany}
          color="#888'#c9a84c"
        />
        <FileImportCard
          label="💰 Sponsors"
          description="Available sponsorship deals"
          onImport={importSponsors}
          color="#4caf50"
        />
        <FileImportCard
          label="📺 TV / Media Deals"
          description="Television and online media contracts"
          onImport={importTVDeals}
          color="#2196f3"
        />
        <FileImportCard
          label="🏆 Championships"
          description="Title belts with optional current champions"
          onImport={importChampionships}
          color="#ff9800"
        />
      </div>

      <button
        onClick={() => { markInitialized(); onComplete?.(); }}
        style={{
          marginTop: 40,
          background: '#c9a84c',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          padding: '14px 48px',
          fontFamily: 'Anton, sans-serif',
          fontSize: 20,
          letterSpacing: 2,
          cursor: 'pointer',
        }}
      >
        START GAME
      </button>
    </div>
  );
}
