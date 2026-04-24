import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency } from '../engine/utils';

export default function BankruptcyModal() {
  const { company, takeEmergencyLoan, resetGame } = useGameStore();
  const [taken, setTaken] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!company.isBankrupt) return null;

  const isGameOver = company.bankruptcyWeeksRemaining <= 0 && company.funds < 0;

  const handleEmergencyLoan = () => {
    takeEmergencyLoan();
    setTaken(true);
  };

  if (confirmReset) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 32, color: '#cc2200', marginBottom: 12 }}>
            ARE YOU SURE?
          </div>
          <div style={{ color: '#888', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            This will permanently erase your save data and start a brand new game.
            All progress will be lost.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => resetGame()}
              style={{ background: '#cc2200', border: 'none', borderRadius: 8, padding: '12px 32px', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer' }}
            >YES, RESTART</button>
            <button
              onClick={() => setConfirmReset(false)}
              style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '12px 24px', color: '#888', fontSize: 15, cursor: 'pointer' }}
            >Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      padding: 24,
    }}>
      {/* Flashing border accent */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        border: '4px solid #cc2200',
        animation: 'borderPulse 1.5s ease-in-out infinite',
      }} />

      <div style={{ textAlign: 'center', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {isGameOver ? (
          <>
            {/* ── GAME OVER ── */}
            <div style={{ fontSize: 72, marginBottom: 8 }}>💀</div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 56, color: '#cc2200', letterSpacing: 4, marginBottom: 8 }}>
              GAME OVER
            </div>
            <div style={{ color: '#666', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              You failed to recover from bankruptcy within the allotted time.<br />
              Your promotion has been liquidated.
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              style={{ width: '100%', background: '#cc2200', border: 'none', borderRadius: 10, padding: '16px', color: '#fff', fontFamily: 'Anton, sans-serif', fontSize: 22, cursor: 'pointer', letterSpacing: 2 }}
            >START NEW GAME</button>
          </>
        ) : (
          <>
            {/* ── BANKRUPTCY ── */}
            <div style={{ fontSize: 64, marginBottom: 8 }}>🔴</div>
            <div style={{
              fontFamily: 'Anton, sans-serif', fontSize: 48, color: '#cc2200',
              letterSpacing: 4, marginBottom: 4,
              textShadow: '0 0 30px rgba(204,34,0,0.6)',
            }}>
              BANKRUPTCY
            </div>
            <div style={{ color: '#888', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>
              Your company has run out of money
            </div>

            {/* Status box */}
            <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 10, padding: 20, marginBottom: 28, textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Current Balance', value: formatCurrency(company.funds), color: '#cc2200' },
                  { label: 'Recovery Time Left', value: `${company.bankruptcyWeeksRemaining} weeks`, color: company.bankruptcyWeeksRemaining <= 2 ? '#cc2200' : '#c9a84c' },
                  { label: 'Sponsors', value: 'All Cancelled', color: '#666' },
                  { label: 'TV Deal', value: 'Cancelled', color: '#666' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#110000', borderRadius: 6, padding: 12 }}>
                    <div style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ color, fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, padding: '10px 14px', background: '#0d0000', borderRadius: 6, fontSize: 13, color: '#666', lineHeight: 1.7 }}>
                <strong style={{ color: '#888' }}>Restrictions active:</strong><br />
                • Cannot book or run shows<br />
                • All development programs suspended<br />
                • Bring funds above $0 within {company.bankruptcyWeeksRemaining} weeks to recover
              </div>
            </div>

            {/* Emergency loan offer */}
            {!taken ? (
              <div style={{ background: '#1a1a00', border: '2px solid #664400', borderRadius: 10, padding: 20, marginBottom: 20, textAlign: 'left' }}>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#c9a84c', marginBottom: 8 }}>🚨 EMERGENCY LOAN AVAILABLE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#888' }}>Amount</span>
                  <span style={{ color: '#c9a84c', fontFamily: 'Anton, sans-serif', fontSize: 18 }}>{formatCurrency(250000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#888' }}>Interest Rate</span>
                  <span style={{ color: '#cc2200' }}>25% — Predatory</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14 }}>
                  <span style={{ color: '#888' }}>Total Repayment</span>
                  <span style={{ color: '#cc2200' }}>{formatCurrency(312500)}</span>
                </div>
                <div style={{ color: '#555', fontSize: 12, marginBottom: 14, lineHeight: 1.6 }}>
                  This is a last resort. The interest rate is punishing, but it's your only lifeline.
                  Use it to book shows, grow followers, and get your finances back in the green.
                </div>
                <button
                  onClick={handleEmergencyLoan}
                  style={{ width: '100%', background: '#3a2000', border: '2px solid #c9a84c', borderRadius: 8, padding: '12px', color: '#c9a84c', fontFamily: 'Anton, sans-serif', fontSize: 18, cursor: 'pointer', letterSpacing: 1 }}
                >TAKE EMERGENCY LOAN</button>
              </div>
            ) : (
              <div style={{ background: '#1a3a1a', border: '1px solid #4caf50', borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'center' }}>
                <div style={{ color: '#4caf50', fontFamily: 'Anton, sans-serif', fontSize: 18 }}>✓ LOAN RECEIVED</div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                  {formatCurrency(250000)} added to your funds. Now book shows and grow your way back!
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmReset(true)}
                style={{ flex: 1, background: 'none', border: '1px solid #440000', borderRadius: 8, padding: '10px', color: '#663333', fontSize: 14, cursor: 'pointer' }}
              >Abandon & Restart</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
