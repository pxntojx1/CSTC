import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency } from '../engine/utils';
import { format, parseISO, isToday } from 'date-fns';
import ShowResults from './ShowResults';

// ── Match Row ─────────────────────────────────────────────────────────────────
function MatchRow({ match, idx, roster, stipulations, championships, onChange, onRemove }) {
  const [showChampToggle, setShowChampToggle] = useState(!!match.championshipId);

  const size = match.participants?.length || 2;
  const selectedChamp = championships.find(c => c.id === match.championshipId);
  const champCurrentIds = selectedChamp?.currentChampion
    ? (Array.isArray(selectedChamp.currentChampion)
        ? selectedChamp.currentChampion : [selectedChamp.currentChampion])
    : [];
  const winnerOptions = (match.participants || []).map(id => roster.find(t => t.id === id)).filter(Boolean);

  return (
    <div className="card" style={{ padding: 16, marginBottom: 10, borderLeft: '3px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', color: 'var(--primary)', fontSize: 13, letterSpacing: 0.5 }}>
          MATCH {idx + 1}
        </div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {/* Format */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 4 }}>Format:</span>
        {[2, 4, 6, 8, 10].map(n => (
          <button key={n} onClick={() => onChange({ participants: Array(n).fill(''), winnerId: '' })}
            className={size === n ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '4px 10px', fontSize: 12 }}>
            {n / 2}v{n / 2}
          </button>
        ))}
      </div>

      {/* Participants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {Array.from({ length: size }).map((_, i) => (
          <select key={i} value={match.participants?.[i] || ''}
            onChange={e => {
              const parts = [...(match.participants || Array(size).fill(''))];
              parts[i] = e.target.value;
              onChange({ participants: parts });
            }}>
            <option value="">— Select Talent —</option>
            {[...roster].sort((a, b) => a.name.localeCompare(b.name)).map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
        ))}
      </div>

      {/* Stipulation */}
      <select value={match.stipulationId || ''}
        onChange={e => onChange({ stipulationId: e.target.value })}
        style={{ marginBottom: 10 }}>
        <option value="">— No Stipulation —</option>
        {stipulations.map(s => (
          <option key={s.id} value={s.id}>{s.name} (Risk {s.risk}/10 · Draw {s.drawingPower}/10)</option>
        ))}
      </select>

      {/* Championship */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 8 }}>
        <input type="checkbox" checked={showChampToggle} onChange={e => {
          setShowChampToggle(e.target.checked);
          if (!e.target.checked) onChange({ championshipId: null });
        }} />
        Championship Match
      </label>
      {showChampToggle && (
        <select value={match.championshipId || ''} onChange={e => onChange({ championshipId: e.target.value })} style={{ marginBottom: 8 }}>
          <option value="">— Select Championship —</option>
          {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      {showChampToggle && selectedChamp && champCurrentIds.length > 0 && !match.participants?.some(id => champCurrentIds.includes(id)) && (
        <div style={{ color: 'var(--warning)', fontSize: 12, marginBottom: 8 }}>⚠ Current champion not in this match (vacant title on the line)</div>
      )}

      {/* Winner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>Winner:</span>
        <select value={match.winnerId || ''} onChange={e => onChange({ winnerId: e.target.value })}>
          <option value="">— Select Winner —</option>
          {winnerOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Segment Row ───────────────────────────────────────────────────────────────
function SegmentRow({ seg, idx, roster, onChange, onRemove }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 10, borderLeft: '3px solid #8b5cf6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', color: '#8b5cf6', fontSize: 13, letterSpacing: 0.5 }}>SEGMENT {idx + 1}</div>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <textarea value={seg.description || ''} onChange={e => onChange({ description: e.target.value })}
        placeholder="Describe the segment (promo, interview, angle…)"
        style={{ minHeight: 60, marginBottom: 10, resize: 'vertical' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[...roster].sort((a, b) => a.name.localeCompare(b.name)).map(t => {
          const isIn = seg.participants?.includes(t.id);
          return (
            <button key={t.id} onClick={() => {
              const current = seg.participants || [];
              onChange({ participants: isIn ? current.filter(id => id !== t.id) : [...current, t.id] });
            }}
              style={{
                padding: '4px 10px', fontSize: 12, borderRadius: 99,
                background: isIn ? '#ede9fe' : '#f3f4f6',
                color: isIn ? '#6d28d9' : 'var(--text-muted)',
                border: isIn ? '1px solid #c4b5fd' : '1px solid var(--border)',
                cursor: 'pointer',
              }}>
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Show Card ─────────────────────────────────────────────────────────────────
function ShowCard({ show, onEdit, currentDate }) {
  const { runShow, deleteShow } = useGameStore();
  const [showResults, setShowResults] = useState(false);

  const isShowDay   = show.date === currentDate;
  const isPast      = show.date < currentDate;
  const isCompleted = show.status === 'completed';
  const canRun      = isShowDay && !isCompleted;

  const daysUntil = !isCompleted
    ? Math.round((parseISO(show.date) - parseISO(currentDate)) / (1000 * 60 * 60 * 24))
    : null;

  const TYPE_BADGE = {
    weekly: { bg: '#dbeafe', color: '#1d4ed8', label: 'WEEKLY' },
    ppv:    { bg: '#ede9fe', color: '#6d28d9', label: 'PPV/SPECIAL' },
  };
  const badge = TYPE_BADGE[show.type] || TYPE_BADGE.weekly;

  return (
    <div className="card" style={{
      padding: 20, marginBottom: 12,
      borderLeft: `4px solid ${isCompleted ? 'var(--border)' : isShowDay ? 'var(--primary)' : isPast ? 'var(--danger)' : 'var(--border)'}`,
      opacity: isPast && !isCompleted ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: 'var(--text)' }}>{show.name}</span>
            <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.5 }}>{badge.label}</span>
            {show.isRecurring && <span className="badge badge-green">🔄 RECURRING</span>}
            {isCompleted && <span className="badge badge-gray">COMPLETED</span>}
            {isShowDay && !isCompleted && <span className="badge badge-green">🟢 TODAY</span>}
            {isPast && !isCompleted && <span className="badge badge-red">MISSED</span>}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
            📅 {format(parseISO(show.date), 'EEEE, MMMM d, yyyy')}
            {daysUntil !== null && daysUntil > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--text-faint)', fontSize: 12 }}>({daysUntil} days away)</span>
            )}
          </div>
          {show.venue?.name && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              📍 {show.venue.name}{show.venue.city ? `, ${show.venue.city}` : ''}{show.venue.capacity ? ` · ${show.venue.capacity.toLocaleString()} cap.` : ''}
            </div>
          )}
          {show.broadcaster && (
            <div style={{ fontSize: 12, color: 'var(--primary-d)', marginTop: 2 }}>
              📺 {show.broadcaster}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-faint)' }}>
            <span>{(show.matches || []).length} matches</span>
            <span>{(show.segments || []).length} segments</span>
            {show.ticketPrice && show.venue?.capacity && (
              <span>Potential: {formatCurrency(show.venue.capacity * show.ticketPrice)}</span>
            )}
            {show.actualAttendance && (
              <span style={{ color: 'var(--primary-d)' }}>Attendance: {show.actualAttendance.toLocaleString()}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isCompleted && (
            <button onClick={() => onEdit(show)} className="btn btn-secondary">Edit</button>
          )}
          {canRun && (
            <button onClick={() => { runShow(show.id); setShowResults(true); }} className="btn btn-primary">
              ▶ Run Show
            </button>
          )}
          {!isCompleted && !isShowDay && !isPast && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', alignSelf: 'center', textAlign: 'right' }}>
              Available<br/>on show day
            </div>
          )}
          {isCompleted && (
            <button onClick={() => setShowResults(true)} className="btn btn-secondary">Results</button>
          )}
          <button onClick={() => { if (window.confirm('Delete this show?')) deleteShow(show.id); }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }}>
            ✕
          </button>
        </div>
      </div>
      {showResults && <ShowResults show={show} onClose={() => setShowResults(false)} />}
    </div>
  );
}

// ── Show Editor ───────────────────────────────────────────────────────────────
function ShowEditor({ show, onSave, onClose }) {
  const { roster, stipulations, championships, activeTVDeal, tvDeals } = useGameStore();
  const [form, setForm] = useState({ ...show });

  const addMatch = () => setForm(f => ({
    ...f,
    matches: [...(f.matches || []), {
      id: `match-${Date.now()}`, participants: ['', ''],
      stipulationId: '', winnerId: '', championshipId: null,
    }],
  }));

  const addSegment = () => setForm(f => ({
    ...f,
    segments: [...(f.segments || []), {
      id: `seg-${Date.now()}`, participants: [], description: '',
    }],
  }));

  const updateMatch   = (idx, data) => setForm(f => ({ ...f, matches:   f.matches.map((m, i)   => i === idx ? { ...m, ...data } : m) }));
  const updateSegment = (idx, data) => setForm(f => ({ ...f, segments:  f.segments.map((s, i)   => i === idx ? { ...s, ...data } : s) }));

  // Broadcaster options: active TV deal + any signed deals
  const broadcasterOptions = [
    ...(activeTVDeal ? [{ id: activeTVDeal.id, name: `${activeTVDeal.broadcaster || activeTVDeal.name} (Active Deal)` }] : []),
    { id: 'none', name: 'No Broadcast / House Show' },
  ];

  const LABEL_S = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 };

  return (
    <div className="modal-backdrop">
      <div style={{
        background: 'var(--card)', borderRadius: 16,
        width: '100%', maxWidth: 820,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: 'var(--text)', letterSpacing: 0.5 }}>
            BOOKING SHEET
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Show details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={LABEL_S}>Show Name</label>
              <input type="text" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL_S}>Date</label>
              <input type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL_S}>Ticket Price ($)</label>
              <input type="number" value={form.ticketPrice || ''} onChange={e => setForm(f => ({ ...f, ticketPrice: +e.target.value }))} />
            </div>
            <div>
              <label style={LABEL_S}>Show Type</label>
              <select value={form.type || 'weekly'} onChange={e => setForm(f => ({
                ...f, type: e.target.value, isRecurring: e.target.value === 'weekly',
              }))}>
                <option value="weekly">Weekly (Recurring)</option>
                <option value="ppv">PPV / Special Event</option>
              </select>
            </div>
            <div>
              <label style={LABEL_S}>TV / Broadcaster</label>
              <select value={form.broadcaster || 'none'} onChange={e => setForm(f => ({
                ...f,
                broadcaster: e.target.value === 'none' ? null : e.target.value,
                tvDealId:    e.target.value === 'none' ? null : activeTVDeal?.id,
              }))}>
                {broadcasterOptions.map(b => (
                  <option key={b.id} value={b.id === 'none' ? 'none' : b.name}>{b.name}</option>
                ))}
              </select>
              {!activeTVDeal && (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
                  Sign a TV deal in Settings → TV Deals to unlock broadcast options.
                </div>
              )}
            </div>
            {form.type === 'weekly' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="recurring" checked={!!form.isRecurring}
                  onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
                <label htmlFor="recurring" style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Auto-schedule next week after completion
                </label>
              </div>
            )}
          </div>

          {/* Venue */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Anton, sans-serif', color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, letterSpacing: 0.5 }}>VENUE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Venue Name', key: 'name',       type: 'text' },
                { label: 'City',       key: 'city',       type: 'text' },
                { label: 'Capacity',   key: 'capacity',   type: 'number' },
                { label: 'Rental ($)', key: 'rentalCost', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ ...LABEL_S, fontSize: 11 }}>{label}</label>
                  <input type={type} value={form.venue?.[key] || ''}
                    onChange={e => setForm(f => ({
                      ...f, venue: { ...f.venue, [key]: type === 'number' ? +e.target.value : e.target.value },
                    }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Matches */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)' }}>MATCHES</div>
              <button onClick={addMatch} className="btn btn-primary" style={{ fontSize: 12 }}>+ Add Match</button>
            </div>
            {(form.matches || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-faint)', fontSize: 13 }}>
                No matches yet — add the first one above.
              </div>
            )}
            {(form.matches || []).map((m, i) => (
              <MatchRow key={m.id} match={m} idx={i} roster={roster} stipulations={stipulations} championships={championships}
                onChange={data => updateMatch(i, data)}
                onRemove={() => setForm(f => ({ ...f, matches: f.matches.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>

          {/* Segments */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--text)' }}>SEGMENTS</div>
              <button onClick={addSegment} className="btn btn-secondary" style={{ fontSize: 12 }}>+ Add Segment</button>
            </div>
            {(form.segments || []).map((seg, i) => (
              <SegmentRow key={seg.id} seg={seg} idx={i} roster={roster}
                onChange={data => updateSegment(i, data)}
                onRemove={() => setForm(f => ({ ...f, segments: f.segments.filter((_, j) => j !== i) }))}
              />
            ))}
          </div>

          {/* Save */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSave(form)} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
              Save Booking
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-lg">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function ShowBuilder() {
  const { shows, currentDate, createShow, updateShow } = useGameStore();
  const [editing, setEditing]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter]     = useState('upcoming'); // 'upcoming' | 'completed' | 'all'

  const handleCreate = () => {
    setEditing({
      id:         `show-${Date.now()}`,
      name:       'New Show',
      date:       currentDate,
      type:       'weekly',
      isRecurring: true,
      status:     'upcoming',
      ticketPrice: 20,
      broadcaster: null,
      venue:      { name: '', city: '', capacity: 500, rentalCost: 2_000 },
      matches:    [],
      segments:   [],
    });
    setCreating(true);
  };

  const handleSave = (form) => {
    if (creating) createShow(form); else updateShow(form.id, form);
    setEditing(null);
    setCreating(false);
  };

  const sorted = [...shows]
    .filter(s => {
      if (filter === 'upcoming') return s.status !== 'completed';
      if (filter === 'completed') return s.status === 'completed';
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title">Shows</div>
          <div className="section-sub">Today: {format(parseISO(currentDate), 'EEEE, MMMM d, yyyy')}</div>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          + Book New Show
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {[['upcoming','Upcoming'],['completed','Completed'],['all','All']].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '7px 16px', borderRadius: 6, border: 'none',
            background: filter === id ? 'var(--card)' : 'transparent',
            color: filter === id ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: 13, fontWeight: filter === id ? 600 : 400,
            boxShadow: filter === id ? 'var(--shadow-sm)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {/* Info box */}
      <div style={{
        background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 8,
        padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#065f46',
        display: 'flex', gap: 8,
      }}>
        <span>💡</span>
        <span>
          <strong>Run Show</strong> is only available on the show's scheduled date.
          Weekly shows auto-schedule the next occurrence after completion.
        </span>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            {filter === 'completed' ? 'No completed shows yet' : 'No shows booked'}
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            {filter !== 'completed' && 'Click "Book New Show" to schedule your first event.'}
          </div>
          {filter !== 'completed' && (
            <button onClick={handleCreate} className="btn btn-primary">+ Book New Show</button>
          )}
        </div>
      ) : (
        sorted.map(show => (
          <ShowCard
            key={show.id} show={show} currentDate={currentDate}
            onEdit={s => { setEditing(s); setCreating(false); }}
          />
        ))
      )}

      {editing && (
        <ShowEditor
          show={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
