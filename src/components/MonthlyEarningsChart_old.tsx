import type { Loan } from '@/types/emprestimos.types';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  loans: Loan[];
  /** number of months to include (including current month). Default: 6 */
  months?: number;
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white p-3 rounded shadow">
      <div className="font-semibold mb-1">{d.monthLabel}</div>
      <div className="text-sm">Principal: {currency(d.principal)}</div>
      <div className="text-sm">Lucro: {currency(d.profit)}</div>
      <div className="text-sm">Total: {currency(d.total)}</div>
      <div className="text-sm">Taxa média anual: {d.avgRate}%</div>
    </div>
  );
}

export default function MonthlyEarningsChart({ loans, months = 6 }: Props) {
  const data = useMemo(() => {
    // prepare month buckets
    const now = new Date();
    const startWindow = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const endWindow = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // build months array (chronological)
    const monthsArr: { key: string; monthStart: Date; monthLabel: string }[] = [];
    let cur = new Date(startWindow);
    const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });
    while (cur <= endWindow) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      monthsArr.push({ key, monthStart: new Date(cur.getFullYear(), cur.getMonth(), 1), monthLabel: monthFmt.format(cur) });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    const map: Record<string, { principal: number; profit: number; weightedRateSum: number; monthLabel: string }> = {};
    for (const m of monthsArr) map[m.key] = { principal: 0, profit: 0, weightedRateSum: 0, monthLabel: m.monthLabel };

    for (const loan of loans) {
      const created = new Date(loan.createdAt);
      if (created < startWindow || created > endWindow) continue;

      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) continue; // safeguard

      const principal = loan.amount || 0;
      map[key].principal += principal;

      if (!loan.interestRate || loan.interestRate <= 0) continue;

      const periodRule = loan.periodRule || 'MENSAL';
      const interestType = loan.interestType || 'SIMPLE';
      const start = new Date(loan.createdAt);
      const end = loan.isPaid && loan.paidDate ? new Date(loan.paidDate) : new Date(loan.dueDate);

      // months duration
      let monthsDur = 0;
      let cur2 = new Date(start);
      while (cur2 < end) {
        cur2.setMonth(cur2.getMonth() + 1);
        if (cur2 <= end) monthsDur++;
      }
      if (monthsDur === 0) {
        const days = Math.abs(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        monthsDur = days / 30;
      }

      const rate = loan.interestRate;
      const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;

      let interestAmount = 0;
      if (interestType === 'SIMPLE') {
        interestAmount = principal * (monthlyRate / 100) * monthsDur;
      } else {
        const amount = principal * Math.pow(1 + monthlyRate / 100, monthsDur);
        interestAmount = amount - principal;
      }

      map[key].profit += interestAmount;
      const annualRate = periodRule === 'MENSAL' ? rate * 12 : rate;
      map[key].weightedRateSum += annualRate * principal;
    }

    const result = Object.entries(map).map(([key, v]) => {
      const avgRate = v.principal ? Math.round((v.weightedRateSum / v.principal) * 100) / 100 : 0;
      const profitRounded = Math.round(v.profit * 100) / 100;
      const principalRounded = Math.round(v.principal * 100) / 100;
      return { month: key, monthLabel: v.monthLabel, principal: principalRounded, profit: profitRounded, total: Math.round((principalRounded + profitRounded) * 100) / 100, avgRate };
    });

    // ensure chronological order
    result.sort((a, b) => (a.month > b.month ? 1 : -1));
    return result;
  }, [loans, months]);

  return (
    <div style={{ width: '100%', height: 320 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">Visão mensal por pessoa</div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="principal" name="Valor emprestado" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
