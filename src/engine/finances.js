export function calcWeeklyTalentCost(roster) {
  return roster.reduce((sum, t) => sum + (t.contract?.salary || 0), 0);
}

export function calcWeeklyShowRevenue(show) {
  if (!show || show.status !== 'completed') return 0;
  const attendance = show.actualAttendance || 0;
  return attendance * (show.ticketPrice || 0);
}

export function calcAttendance(show, company) {
  const capacity = show.venue?.capacity || 0;
  const base = Math.min(company.followers / 10000, 1) * 0.6;
  const ppvBonus = show.type === 'ppv' ? 0.2 : 0;
  const rate = Math.min(base + ppvBonus + Math.random() * 0.2, 1);
  return Math.round(capacity * rate);
}

export function getLoanInterestRate(followers) {
  if (followers < 10000) return 0.18;
  if (followers < 50000) return 0.14;
  if (followers < 200000) return 0.10;
  if (followers < 1000000) return 0.07;
  return 0.04;
}

export function calcMonthlyLoanPayment(principal, rate) {
  return (principal * (1 + rate)) / 12;
}
