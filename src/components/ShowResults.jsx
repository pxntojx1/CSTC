import useGameStore from '../store/gameStore';
import { formatCurrency } from '../engine/utils';

function StarDisplay({ rating }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.25;
  const color = rating >= 4 ? '#ffd700' : rating >= 3 ? '#c9a84c' : rating >= 2 ? '#e0e0e0' : '#555';
  const glow = rating >= 4 ? '0 0 8px #ffd700' : 'none';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ color, textShadow: glow, fontSize: 18, letterSpacing: 2 }}>
        {'★'.repeat(fullStars)}{hasHalf ? '½' : ''}{'☆'.repeat(Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0)))}
      </div>
      <span style={{ color, fontSize: 14, fontWeight: 700, marginLeft: 4 }}>{rating.toFixed(2)}</span>
    </div>
  );
}

export default function ShowResults({ show, onClose }) {
  const { roster, championships, stipulations } = useGameStore();

  if (!show.results) return null;

  const matchResults = show.results.filter(r => r.type === 'match');
  const segmentResults = show.results.filter(r => r.type === 'segment');

  const avgRating = show.results.length
    ? show.results.reduce((a, r) => a + r.finalRating, 0) / show.results.length
    : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 700, width: '100%', background: '#0d0d0d', border: '1px solid #333', borderRadius: 12, padding: 32, height: 'fit-content' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #c9a84c', paddingBottom: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 36, color: '#c9a84c', letterSpacing: 4 }}>{show.name}</div>
          <div style={{ color: '#888', marginTop: 4 }}>{show.venue?.name} · {show.venue?.city}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase' }}>Attendance</div>
              <div style={{ color: '#e0e0e0', fontFamily: 'Anton, sans-serif', fontSize: 22 }}>{show.actualAttendance?.toLocaleString() ?? '—'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase' }}>Revenue</div>
              <div style={{ color: '#4caf50', fontFamily: 'Anton, sans-serif', fontSize: 22 }}>{formatCurrency(show.revenue || 0)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase' }}>Impressions</div>
              <div style={{ color: show.totalImpressions >= 0 ? '#4caf50' : '#cc2200', fontFamily: 'Anton, sans-serif', fontSize: 22 }}>
                {show.totalImpressions >= 0 ? '+' : ''}{show.totalImpressions?.toLocaleString() ?? '0'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase' }}>Avg Rating</div>
              <div style={{ color: '#c9a84c', fontFamily: 'Anton, sans-serif', fontSize: 22 }}>{avgRating.toFixed(2)}★</div>
            </div>
          </div>
        </div>

        {/* Match card results */}
        {show.matches?.map((match, i) => {
          const result = matchResults.find(r => r.matchId === match.id);
          const participants = (match.participants || []).map(id => roster.find(t => t.id === id)).filter(Boolean);
          const winner = match.winnerId ? roster.find(t => t.id === match.winnerId) : null;
          const stip = stipulations.find(s => s.id === match.stipulationId);
          const champ = match.championshipId ? championships.find(c => c.id === match.championshipId) : null;

          const currentChampIds = champ?.currentChampion
            ? (Array.isArray(champ.currentChampion) ? champ.currentChampion : [champ.currentChampion])
            : [];
          const isTitleChange = champ && match.winnerId && !currentChampIds.includes(match.winnerId);

          return (
            <div key={match.id} style={{ background: '#111', border: `1px solid ${result?.finalRating >= 4 ? '#c9a84c' : '#222'}`, borderRadius: 8, padding: 20, marginBottom: 12, boxShadow: result?.finalRating >= 4 ? '0 0 16px rgba(201,168,76,0.2)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  {champ && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ background: '#8b0000', color: '#ff8888', fontSize: 10, padding: '2px 8px', borderRadius: 3, fontFamily: 'Anton, sans-serif' }}>🏆 {champ.name}</span>
                      {isTitleChange && (
                        <span style={{ background: '#c9a84c', color: '#000', fontSize: 11, padding: '2px 10px', borderRadius: 3, fontFamily: 'Anton, sans-serif', animation: 'pulse 1s infinite' }}>★ TITLE CHANGE ★</span>
                      )}
                    </div>
                  )}
                  <div style={{ color: '#e0e0e0', fontSize: 15 }}>
                    {participants.map(p => p.name).join(' vs ')}
                  </div>
                  {stip && <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{stip.name}</div>}
                </div>
                {result && <StarDisplay rating={result.finalRating} />}
              </div>
              {winner && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                  <span style={{ color: '#555', fontSize: 12 }}>Winner:</span>
                  <span style={{ color: '#c9a84c', fontFamily: 'Anton, sans-serif', fontSize: 14 }}>{winner.name}</span>
                </div>
              )}
              {result?.impressions !== 0 && (
                <div style={{ color: result.impressions > 0 ? '#4caf50' : '#cc2200', fontSize: 12, marginTop: 4 }}>
                  {result.impressions > 0 ? '+' : ''}{result.impressions?.toLocaleString()} followers
                </div>
              )}
            </div>
          );
        })}

        {/* Segments */}
        {show.segments?.map((seg, i) => {
          const result = segmentResults.find(r => r.segmentId === seg.id);
          const participants = (seg.participants || []).map(id => roster.find(t => t.id === id)).filter(Boolean);
          return (
            <div key={seg.id} style={{ background: '#0d0d1a', border: '1px solid #1a1a2a', borderRadius: 8, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#9c27b0', fontFamily: 'Anton, sans-serif', fontSize: 13 }}>SEGMENT</div>
                  <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{participants.map(p => p.name).join(', ')}</div>
                  {seg.description && <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>{seg.description}</div>}
                </div>
                {result && <StarDisplay rating={result.finalRating} />}
              </div>
            </div>
          );
        })}

        <button onClick={onClose}
          style={{ width: '100%', marginTop: 20, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '12px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer' }}
        >CLOSE RESULTS</button>
      </div>
    </div>
  );
}
