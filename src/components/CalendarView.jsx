import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isSameDay, addMonths, subMonths } from 'date-fns';
import useGameStore from '../store/gameStore';

export default function CalendarView({ onNavigate }) {
  const { shows, currentDate, advanceDay, weeklyLog, company, roster } = useGameStore();
  const [viewDate, setViewDate] = useState(parseISO(currentDate));
  const [selectedShow, setSelectedShow] = useState(null);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [lastWeekLog, setLastWeekLog] = useState(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const getShowsForDay = (day) =>
    shows.filter(s => {
      try { return isSameDay(parseISO(s.date), day); } catch { return false; }
    });

  const handleAdvance = () => {
    advanceDay();
    // Read post-advance state synchronously via getState (Zustand pattern)
    const { weeklyLog: log } = useGameStore.getState();
    setLastWeekLog(log[log.length - 1] || null);
    setShowWeekModal(true);
  };

  const today = parseISO(currentDate);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2 }}>CALENDAR</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ color: '#888', fontSize: 14 }}>
            Week {useGameStore.getState().weekNumber} · {format(today, 'MMM d, yyyy')}
          </div>
          <button onClick={handleAdvance}
            style={{ background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}
          >▶ ADVANCE WEEK</button>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setViewDate(d => subMonths(d, 1))} style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '6px 14px', color: '#888', cursor: 'pointer', fontSize: 16 }}>‹</button>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: '#e0e0e0' }}>{format(viewDate, 'MMMM yyyy')}</div>
        <button onClick={() => setViewDate(d => addMonths(d, 1))} style={{ background: 'none', border: '1px solid #333', borderRadius: 6, padding: '6px 14px', color: '#888', cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#555', fontSize: 12, padding: '8px 0', fontFamily: 'Anton, sans-serif', letterSpacing: 1 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} style={{ background: '#0d0d0d', borderRadius: 4, minHeight: 90 }} />
        ))}
        {days.map(day => {
          const dayShows = getShowsForDay(day);
          const isToday = isSameDay(day, today);
          const isPast = day < today;

          return (
            <div key={day.toISOString()} style={{
              background: isToday ? '#1a2a1a' : '#1a1a1a',
              border: `1px solid ${isToday ? '#4caf50' : '#222'}`,
              borderRadius: 4,
              minHeight: 90,
              padding: 6,
              opacity: isPast && !isSameDay(day, today) ? 0.6 : 1,
            }}>
              <div style={{ color: isToday ? '#4caf50' : '#555', fontSize: 13, fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>
                {format(day, 'd')}
              </div>
              {dayShows.map(show => (
                <div key={show.id} onClick={() => setSelectedShow(show)}
                  style={{
                    background: show.type === 'ppv' ? '#3a0000' : '#1a2a3a',
                    border: `1px solid ${show.type === 'ppv' ? '#cc2200' : '#2196f3'}`,
                    borderRadius: 3,
                    padding: '2px 5px',
                    fontSize: 10,
                    color: show.type === 'ppv' ? '#ff8888' : '#4fc3f7',
                    cursor: 'pointer',
                    marginBottom: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {show.status === 'completed' ? '✓ ' : ''}{show.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#555' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, background: '#2196f3', borderRadius: 2 }} />Weekly Show
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, background: '#cc2200', borderRadius: 2 }} />PPV / Special
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, background: '#1a2a1a', border: '1px solid #4caf50', borderRadius: 2 }} />Today
        </div>
      </div>

      {/* Show detail modal */}
      {selectedShow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: 28, width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, color: '#c9a84c' }}>{selectedShow.name}</div>
              <button onClick={() => setSelectedShow(null)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{format(parseISO(selectedShow.date), 'EEEE, MMMM d, yyyy')}</div>
            {selectedShow.venue && <div style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>{selectedShow.venue.name} · {selectedShow.venue.city}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => { setSelectedShow(null); onNavigate?.('shows'); }}
                style={{ flex: 1, background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, padding: '8px', color: '#e0e0e0', cursor: 'pointer', fontSize: 14 }}
              >Go to Show</button>
              {selectedShow.status === 'completed' && (
                <button onClick={() => { setSelectedShow(null); onNavigate?.('shows'); }}
                  style={{ flex: 1, background: '#c9a84c', border: 'none', borderRadius: 6, padding: '8px', color: '#000', fontFamily: 'Anton, sans-serif', cursor: 'pointer', fontSize: 14 }}
                >View Results</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Week summary modal */}
      {showWeekModal && lastWeekLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#1a1a1a', border: '2px solid #c9a84c', borderRadius: 12, padding: 32, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 26, color: '#c9a84c', marginBottom: 4 }}>WEEK {lastWeekLog.week} SUMMARY</div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>{format(parseISO(lastWeekLog.date), 'MMMM d, yyyy')}</div>

            {(lastWeekLog.log || []).length === 0 ? (
              <div style={{ color: '#444', fontSize: 14 }}>No financial activity this week</div>
            ) : (
              (lastWeekLog.log || []).map((entry, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, borderBottom: '1px solid #222', paddingBottom: 8 }}>
                  <span style={{ color: '#888' }}>{entry.label}</span>
                  <span style={{ color: entry.amount >= 0 ? '#4caf50' : '#cc2200' }}>
                    {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}

            {(lastWeekLog.expiringTalent || []).length > 0 && (
              <div style={{ background: '#2a1a00', border: '1px solid #664400', borderRadius: 6, padding: 12, marginTop: 12 }}>
                <div style={{ color: '#cc8800', fontFamily: 'Anton, sans-serif', fontSize: 14, marginBottom: 6 }}>⚠ CONTRACTS EXPIRING</div>
                {lastWeekLog.expiringTalent.map(id => {
                  const t = roster.find(r => r.id === id);
                  return t ? <div key={id} style={{ color: '#888', fontSize: 13 }}>{t.name}</div> : null;
                })}
              </div>
            )}

            {company.isBankrupt && (
              <div style={{ background: '#3a0000', border: '2px solid #cc2200', borderRadius: 8, padding: 14, marginTop: 12 }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#cc2200' }}>⚠ COMPANY IS BANKRUPT</div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>{company.bankruptcyWeeksRemaining} weeks remaining to recover</div>
              </div>
            )}

            <button onClick={() => setShowWeekModal(false)}
              style={{ width: '100%', marginTop: 20, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '12px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer' }}
            >CONTINUE</button>
          </div>
        </div>
      )}
    </div>
  );
}
