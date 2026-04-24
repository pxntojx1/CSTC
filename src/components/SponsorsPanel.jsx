import useGameStore from '../store/gameStore';
import { formatCurrency, formatFollowers } from '../engine/utils';

export default function SponsorsPanel() {
  const { sponsors, activeSponsors, company, signSponsor, cancelSponsor } = useGameStore();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2, marginBottom: 8 }}>SPONSORS</div>
      <div style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>Current followers: {formatFollowers(company.followers)}</div>

      {sponsors.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#444' }}>
          <div style={{ fontSize: 20, fontFamily: 'Anton, sans-serif' }}>NO SPONSORS LOADED</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Import a sponsors JSON file from Settings to see available deals</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {sponsors.map(sp => {
          const isActive = activeSponsors.some(a => a.id === sp.id);
          const isLocked = company.followers < sp.minimumFollowers;
          const progress = Math.min(company.followers / sp.minimumFollowers, 1);

          let statusColor = '#4caf50';
          let statusLabel = 'AVAILABLE';
          let statusBg = '#1a3a1a';
          if (isActive) { statusColor = '#2196f3'; statusLabel = 'ACTIVE'; statusBg = '#1a2a3a'; }
          else if (isLocked) { statusColor = '#666'; statusLabel = 'LOCKED'; statusBg = '#1a1a1a'; }

          return (
            <div key={sp.id} style={{ background: '#1a1a1a', border: `1px solid ${isActive ? '#2196f3' : isLocked ? '#222' : '#2a4a2a'}`, borderRadius: 10, padding: 20, opacity: isLocked ? 0.6 : 1 }}>
              {sp.logo && <img src={sp.logo} alt={sp.name} style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 10 }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#e0e0e0' }}>{sp.name}</div>
                <span style={{ background: statusBg, color: statusColor, fontSize: 11, padding: '2px 8px', borderRadius: 3 }}>{statusLabel}</span>
              </div>

              {sp.description && <div style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>{sp.description}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: '#555', fontSize: 11 }}>Min. Followers</div>
                  <div style={{ color: '#888' }}>{formatFollowers(sp.minimumFollowers)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#555', fontSize: 11 }}>Annual Value</div>
                  <div style={{ color: '#4caf50', fontFamily: 'Anton, sans-serif', fontSize: 16 }}>{formatCurrency(sp.annualPayment)}</div>
                  <div style={{ color: '#555', fontSize: 11 }}>{formatCurrency(sp.annualPayment / 52)}/week</div>
                </div>
              </div>

              {isLocked && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginBottom: 4 }}>
                    <span>{formatFollowers(company.followers)}</span>
                    <span>{formatFollowers(sp.minimumFollowers)}</span>
                  </div>
                  <div style={{ background: '#222', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: '#c9a84c', borderRadius: 3 }} />
                  </div>
                  <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
                    Need {formatFollowers(sp.minimumFollowers - company.followers)} more followers
                  </div>
                </div>
              )}

              {!isLocked && !isActive && (
                <button onClick={() => signSponsor(sp.id)}
                  style={{ width: '100%', background: '#2a4a2a', border: '1px solid #4caf50', borderRadius: 6, padding: '8px', color: '#4caf50', fontFamily: 'Anton, sans-serif', cursor: 'pointer', fontSize: 15 }}
                >SIGN DEAL</button>
              )}
              {isActive && (
                <button onClick={() => { if (confirm(`Cancel ${sp.name} sponsor deal?`)) cancelSponsor(sp.id); }}
                  style={{ width: '100%', background: '#1a1a2a', border: '1px solid #333', borderRadius: 6, padding: '8px', color: '#888', cursor: 'pointer', fontSize: 13 }}
                >Cancel Deal</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
