import useGameStore from '../store/gameStore';
import { formatCurrency, formatFollowers } from '../engine/utils';

const TYPE_BADGE = {
  tv:        { bg: '#dbeafe', color: '#1d4ed8',  label: 'TV' },
  streaming: { bg: '#ede9fe', color: '#6d28d9',  label: 'STREAMING' },
  youtube:   { bg: '#fee2e2', color: '#dc2626',  label: 'YOUTUBE' },
  podcast:   { bg: '#d1fae5', color: '#065f46',  label: 'PODCAST' },
};

export default function TVDealsPanel() {
  const { tvDeals, activeTVDeal, company, signTVDeal, cancelTVDeal } = useGameStore();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="section-title">TV & Media Deals</div>
        <div className="section-sub">
          Your followers: <strong>{formatFollowers(company.followers)}</strong>
          {' · '}To add more deals, go to <strong>Settings → Import Data</strong>
        </div>
      </div>

      {/* Active deal */}
      {activeTVDeal && (
        <div style={{
          background: '#f0fdf4', border: '2px solid #10b981',
          borderRadius: 12, padding: 20, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--primary-d)', fontWeight: 700, marginBottom: 4 }}>
                🟢 ACTIVE DEAL
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: 'var(--text)' }}>{activeTVDeal.name}</div>
              {activeTVDeal.broadcaster && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>📺 {activeTVDeal.broadcaster}</div>
              )}
              {activeTVDeal.description && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{activeTVDeal.description}</div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weeks Remaining</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: 'var(--primary)' }}>
                {activeTVDeal.weeksRemaining}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid #d1fae5' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Annual Value</div>
              <div style={{
                fontFamily: 'Anton, sans-serif', fontSize: 18,
                color: activeTVDeal.annualValue >= 0 ? 'var(--primary-d)' : 'var(--danger)',
              }}>
                {activeTVDeal.annualValue >= 0 ? '+' : ''}{formatCurrency(activeTVDeal.annualValue)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekly</div>
              <div style={{ fontSize: 15, color: activeTVDeal.annualValue >= 0 ? 'var(--primary-d)' : 'var(--danger)' }}>
                {activeTVDeal.annualValue >= 0 ? '+' : ''}{formatCurrency(activeTVDeal.annualValue / 52)}/wk
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration</div>
              <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>{activeTVDeal.durationWeeks} weeks total</div>
            </div>
          </div>

          {company.followers < activeTVDeal.minimumFollowers && (
            <div style={{
              background: 'var(--warning-lt)', border: '1px solid #fcd34d',
              borderRadius: 8, padding: 10, marginTop: 12, color: '#92400e', fontSize: 13,
            }}>
              ⚠ AT RISK: Followers dropped below minimum requirement. Deal may be cancelled.
            </div>
          )}

          <button
            onClick={() => { if (window.confirm('Cancel this deal? You will pay a 4-week penalty.')) cancelTVDeal(); }}
            className="btn btn-ghost"
            style={{ marginTop: 12, color: 'var(--danger)', borderColor: '#fca5a5' }}
          >
            Cancel Deal (4-week penalty)
          </button>
        </div>
      )}

      {/* Deals table */}
      {tvDeals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📺</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>No Deals Available</div>
          <div style={{ fontSize: 13 }}>Go to <strong>Settings → Import Data</strong> to load TV deals.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Min. Followers</th>
                <th style={{ textAlign: 'right' }}>Duration</th>
                <th style={{ textAlign: 'right' }}>Annual Value</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tvDeals.map(deal => {
                const isActive     = activeTVDeal?.id === deal.id;
                const isLocked     = company.followers < deal.minimumFollowers;
                const hasOtherDeal = !!activeTVDeal && !isActive;
                const tc = TYPE_BADGE[deal.type] || TYPE_BADGE.tv;

                return (
                  <tr key={deal.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{deal.name}</div>
                      {deal.broadcaster && <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>📺 {deal.broadcaster}</div>}
                      {deal.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{deal.description}</div>}
                    </td>
                    <td>
                      <span style={{ background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                        {tc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: isLocked ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {formatFollowers(deal.minimumFollowers)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{deal.durationWeeks}w</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'Anton, sans-serif', fontSize: 15,
                        color: deal.annualValue >= 0 ? 'var(--primary-d)' : 'var(--danger)',
                      }}>
                        {deal.annualValue >= 0 ? '+' : ''}{formatCurrency(deal.annualValue)}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {formatCurrency(deal.annualValue / 52)}/wk
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isActive     && <span className="badge badge-green">ACTIVE</span>}
                      {!isActive && isLocked && <span className="badge badge-gray">LOCKED</span>}
                      {!isActive && !isLocked && hasOtherDeal && <span className="badge badge-yellow">UNAVAILABLE</span>}
                      {!isActive && !isLocked && !hasOtherDeal && <span className="badge badge-green">AVAILABLE</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!isActive && !isLocked && !hasOtherDeal && (
                        <button onClick={() => signTVDeal(deal.id)} className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px' }}>
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
