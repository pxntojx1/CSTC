import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { formatCurrency } from '../engine/utils';
import { getLoanInterestRate, calcMonthlyLoanPayment } from '../engine/finances';

function MiniLineChart({ data, width = 500, height = 100 }) {
  if (!data || data.length < 2) return <div style={{ color: '#444', fontSize: 13, padding: 20 }}>Not enough data for chart</div>;

  const values = data.map(d => d.funds);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.funds - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const zeroY = height - ((0 - min) / range) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 100 }}>
      <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="#333" strokeWidth={1} strokeDasharray="4,4" />
      <polyline fill="none" stroke="#c9a84c" strokeWidth={2} points={pts} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.funds - min) / range) * height;
        return <circle key={i} cx={x} cy={y} r={2} fill={d.funds < 0 ? '#cc2200' : '#c9a84c'} />;
      })}
    </svg>
  );
}

function LoanModal({ onClose }) {
  const { company, loans, takeLoan } = useGameStore();
  const [amount, setAmount] = useState(50000);

  const rate = getLoanInterestRate(company.followers);
  const monthly = calcMonthlyLoanPayment(amount, rate);
  const total = amount * (1 + rate);

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalMonthly = activeLoans.reduce((s, l) => s + l.monthlyPayment, 0) + monthly;

  const confirm = () => {
    takeLoan(amount);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 12, padding: 32, width: 460 }}>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, color: '#c9a84c', marginBottom: 20 }}>TAKE A LOAN</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#888', fontSize: 13, display: 'block', marginBottom: 8 }}>Loan Amount: {formatCurrency(amount)}</label>
          <input type="range" min={10000} max={5000000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)}
            style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 11 }}>
            <span>$10K</span><span>$5M</span>
          </div>
        </div>

        <div style={{ background: '#111', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          {[
            { label: 'Loan Amount', value: formatCurrency(amount), color: '#e0e0e0' },
            { label: 'Interest Rate', value: `${(rate * 100).toFixed(0)}% annual`, color: '#888' },
            { label: 'Monthly Payment', value: formatCurrency(monthly), color: '#c9a84c' },
            { label: 'Total Repayment', value: formatCurrency(total), color: '#cc2200' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {totalMonthly > 0 && (
          <div style={{ background: '#2a1a00', border: '1px solid #664400', borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 12, color: '#cc8800' }}>
            ⚠ Total monthly loan burden will be {formatCurrency(totalMonthly)} after this loan
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={confirm} style={{ flex: 1, background: '#c9a84c', border: 'none', borderRadius: 8, padding: '10px', color: '#000', fontFamily: 'Anton, sans-serif', fontSize: 16, cursor: 'pointer' }}>
            TAKE LOAN
          </button>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 16px', color: '#888', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinancesPanel() {
  const { company, roster, activeSponsors, activeTVDeal, developmentPrograms, loans, financeHistory, weeklyLog, company: { negativeFundsStreak } } = useGameStore();
  const [showLoanModal, setShowLoanModal] = useState(false);

  const weeklySalary = roster.reduce((s, t) => s + (t.contract?.salary || 0), 0);
  const weeklyTV = activeTVDeal ? activeTVDeal.annualValue / 52 : 0;
  const weeklySponsors = activeSponsors.reduce((s, sp) => s + sp.annualPayment / 52, 0);
  const weeklyDevCost = developmentPrograms.reduce((s, p) => s + (p.weeklyCost || 0), 0);

  const activeLoans = loans.filter(l => l.status === 'active');
  const weeklyNet = weeklyTV + weeklySponsors - weeklySalary - weeklyDevCost;

  const lastLog = (weeklyLog || []).slice(-1)[0];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, color: '#c9a84c', letterSpacing: 2, marginBottom: 24 }}>FINANCES</div>

      {/* Balance */}
      <div style={{ background: '#1a1a1a', border: `2px solid ${company.funds < 0 ? '#cc2200' : '#333'}`, borderRadius: 10, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ color: '#666', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>Current Balance</div>
        <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 52, color: company.funds < 0 ? '#cc2200' : '#c9a84c' }}>
          {formatCurrency(company.funds)}
        </div>
        {negativeFundsStreak > 0 && (
          <div style={{ color: '#cc2200', fontSize: 13, marginTop: 8 }}>
            ⚠ Negative for {negativeFundsStreak} consecutive month(s)
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Weekly breakdown */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c', marginBottom: 16 }}>WEEKLY BREAKDOWN</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#4caf50', fontFamily: 'Anton, sans-serif', fontSize: 13, marginBottom: 8 }}>INCOME</div>
            {[
              { label: 'TV Deal', value: weeklyTV },
              { label: 'Sponsors', value: weeklySponsors },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ color: '#4caf50' }}>+{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
            <div style={{ color: '#cc2200', fontFamily: 'Anton, sans-serif', fontSize: 13, marginBottom: 8 }}>EXPENSES</div>
            {[
              { label: 'Talent Salaries', value: -weeklySalary },
              { label: 'Development', value: -weeklyDevCost },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ color: '#cc2200' }}>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontFamily: 'Anton, sans-serif', fontSize: 16 }}>
            <span style={{ color: '#888' }}>WEEKLY NET</span>
            <span style={{ color: weeklyNet >= 0 ? '#4caf50' : '#cc2200' }}>{weeklyNet >= 0 ? '+' : ''}{formatCurrency(weeklyNet)}</span>
          </div>
        </div>

        {/* History chart */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c', marginBottom: 16 }}>FUNDS HISTORY</div>
          <MiniLineChart data={financeHistory || []} />
        </div>
      </div>

      {/* Loans section */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 18, color: '#c9a84c' }}>LOANS</div>
          <button onClick={() => setShowLoanModal(true)}
            style={{ background: '#c9a84c', border: 'none', borderRadius: 6, padding: '6px 18px', color: '#000', fontFamily: 'Anton, sans-serif', cursor: 'pointer', fontSize: 14 }}
          >+ TAKE LOAN</button>
        </div>

        {activeLoans.length === 0 ? (
          <div style={{ color: '#444', fontSize: 14 }}>No active loans</div>
        ) : (
          activeLoans.map(loan => {
            const progress = loan.amountPaid / loan.totalRepayment;
            return (
              <div key={loan.id} style={{ background: '#111', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: loan.isEmergency ? '#cc2200' : '#e0e0e0' }}>
                    {loan.isEmergency ? '🚨 Emergency Loan' : 'Bank Loan'} — {(loan.rate * 100).toFixed(0)}%
                  </span>
                  <span style={{ color: '#888' }}>
                    {formatCurrency(loan.amountPaid)} / {formatCurrency(loan.totalRepayment)}
                  </span>
                </div>
                <div style={{ background: '#1a1a1a', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: '#c9a84c', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#555' }}>
                  <span>Monthly: {formatCurrency(loan.monthlyPayment)}</span>
                  <span>Remaining: {formatCurrency(loan.totalRepayment - loan.amountPaid)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paid loans */}
      {loans.filter(l => l.status === 'paid').length > 0 && (
        <div style={{ background: '#111', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ color: '#555', fontSize: 12, marginBottom: 8 }}>Paid Off Loans</div>
          {loans.filter(l => l.status === 'paid').map(loan => (
            <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#444', marginBottom: 4 }}>
              <span>Loan Week {loan.takenWeek}</span>
              <span style={{ color: '#2a7a2a' }}>✓ Paid {formatCurrency(loan.totalRepayment)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent weekly log */}
      {lastLog && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: '#c9a84c', marginBottom: 12 }}>LAST WEEK LOG</div>
          {(lastLog.log || []).map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: '#888' }}>{entry.label}</span>
              <span style={{ color: entry.amount >= 0 ? '#4caf50' : '#cc2200' }}>
                {entry.amount >= 0 ? '+' : ''}{formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {showLoanModal && <LoanModal onClose={() => setShowLoanModal(false)} />}
    </div>
  );
}
