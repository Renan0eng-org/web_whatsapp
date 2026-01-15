'use client';

import type { Loan } from '@/types/emprestimos.types';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  loans: Loan[];
  /** number of months to include (including current month). Default: 6 */
  months?: number;
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MonthlyEarningsChart({ loans, months = 6 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const [ApexCharts, setApexCharts] = useState<any>(null);

  // Load ApexCharts only on client side
  useEffect(() => {
    import('apexcharts').then((module) => {
      setApexCharts(() => module.default);
    });
  }, []);

  const { chartData, series } = useMemo(() => {
    const now = new Date();
    const startWindow = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const endWindow = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

    // Estrutura para armazenar dados por mês (baseado na data de vencimento)
    const monthsData: Record<string, { monthLabel: string; loans: any[] }> = {};
    const categories: string[] = [];

    // Inicializar todos os meses no intervalo
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthFmt.format(date);
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { monthLabel, loans: [] };
      }
    }

    for (const loan of loans) {
      const created = new Date(loan.createdAt);
      // Filtrar apenas empréstimos criados dentro do período
      if (created < startWindow || created > endWindow) continue;

      const borrowerName = loan.borrowerName || 'Sem nome';
      const principal = loan.amount || 0;

      // Se o empréstimo tem juros recorrentes, adicionar entrada para cada mês
      if (loan.isRecurringInterest && loan.interestRate && loan.interestRate > 0) {
        const periodRule = loan.periodRule || 'MENSAL';
        const monthlyRate = periodRule === 'ANUAL' ? loan.interestRate / 12 : loan.interestRate;
        const monthlyInterest = principal * (monthlyRate / 100);
        
        // Para cada mês entre a criação e o vencimento (ou hoje se ainda pendente)
        const start = new Date(loan.createdAt);
        const end = loan.isPaid && loan.paidDate ? new Date(loan.paidDate) : new Date(loan.dueDate);
        
        let cur = new Date(start.getFullYear(), start.getMonth() + 1, 1); // Começa no próximo mês
        while (cur <= end && cur <= endWindow) {
          if (cur >= startWindow) {
            const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = monthFmt.format(cur);
            
            if (!monthsData[monthKey]) {
              monthsData[monthKey] = { monthLabel, loans: [] };
            }

            // Verificar se já foi pago este mês (baseado em recurringPayments)
            const isPaidThisMonth = loan.recurringPayments?.some((p: any) => {
              const refMonth = new Date(p.referenceMonth);
              return refMonth.getMonth() === cur.getMonth() && 
                     refMonth.getFullYear() === cur.getFullYear() && 
                     p.isPaid;
            }) || false;

            monthsData[monthKey].loans.push({
              borrowerName,
              principal: 0, // Não mostrar o principal aqui
              profit: Math.round(monthlyInterest * 100) / 100,
              total: Math.round(monthlyInterest * 100) / 100,
              rate: loan.interestRate,
              periodRule: loan.periodRule || 'MENSAL',
              loanId: loan.idLoan,
              isRecurring: true,
              isPaid: isPaidThisMonth
            });
          }
          cur.setMonth(cur.getMonth() + 1);
        }
      } else {
        // Empréstimo sem juros recorrentes - usar data de vencimento para exibição
        const dueDate = new Date(loan.dueDate);
        if (dueDate < startWindow || dueDate > endWindow) continue;

        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = monthFmt.format(dueDate);

        let profit = 0;
        if (loan.interestRate && loan.interestRate > 0) {
          const periodRule = loan.periodRule || 'MENSAL';
          const interestType = loan.interestType || 'SIMPLE';
          const start = new Date(loan.createdAt);
          const end = loan.isPaid && loan.paidDate ? new Date(loan.paidDate) : new Date(loan.dueDate);

          let monthsDur = 0;
          let cur = new Date(start);
          while (cur < end) {
            cur.setMonth(cur.getMonth() + 1);
            if (cur <= end) monthsDur++;
          }
          if (monthsDur === 0) {
            const days = Math.abs(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            monthsDur = days / 30;
          }

          const rate = loan.interestRate;
          const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;

          if (interestType === 'SIMPLE') {
            profit = principal * (monthlyRate / 100) * monthsDur;
          } else {
            const amount = principal * Math.pow(1 + monthlyRate / 100, monthsDur);
            profit = amount - principal;
          }
        }

        const profitRounded = Math.round(profit * 100) / 100;
        const principalRounded = Math.round(principal * 100) / 100;
        const total = Math.round((principalRounded + profitRounded) * 100) / 100;

        if (!monthsData[monthKey]) {
          monthsData[monthKey] = { monthLabel, loans: [] };
        }

        monthsData[monthKey].loans.push({
          borrowerName,
          principal: principalRounded,
          profit: profitRounded,
          total,
          rate: loan.interestRate || 0,
          periodRule: loan.periodRule || 'MENSAL',
          loanId: loan.idLoan || Math.random(),
          isRecurring: false,
          isPaid: loan.isPaid
        });
      }
    }

    // Prepare series data for ApexCharts
    const sortedMonths = Object.keys(monthsData).sort();
    sortedMonths.forEach(monthKey => {
      categories.push(monthsData[monthKey].monthLabel);
    });

    // Create series for each unique loan (borrower + loan number)
    const seriesMap: Record<string, { data: number[], details: any[] }> = {};

    sortedMonths.forEach(monthKey => {
      monthsData[monthKey].loans.forEach((loan, index) => {
        const suffix = loan.isRecurring ? ' (Recorrente)' : '';
        const seriesName = `${loan.borrowerName}${suffix} #${index + 1}`;
        if (!seriesMap[seriesName]) {
          seriesMap[seriesName] = {
            data: new Array(categories.length).fill(0),
            details: new Array(categories.length).fill(null)
          };
        }
        const monthIndex = categories.indexOf(monthsData[monthKey].monthLabel);
        // Para recorrentes, mostrar o lucro; para normais, mostrar o principal
        seriesMap[seriesName].data[monthIndex] = loan.isRecurring ? loan.profit : loan.principal;
        seriesMap[seriesName].details[monthIndex] = loan;
      });
    });

    const seriesData = Object.entries(seriesMap).map(([name, data]) => ({
      name,
      data: data.data,
      details: data.details
    }));

    return { chartData: categories, series: seriesData };
  }, [loans, months]);

  useEffect(() => {
    if (!chartRef.current || series.length === 0 || !ApexCharts) return;

    const options = {
      chart: {
        type: 'bar',
        height: 320,
        stacked: false,
        toolbar: { show: false }
      },
      series: series.map(s => ({ name: s.name, data: s.data })),
      xaxis: {
        categories: chartData,
        labels: {
          rotate: -30,
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => {
            const abs = Math.abs(val);
            if (abs >= 1000000) return Math.round(val / 1000000) + 'M';
            if (abs >= 1000) return Math.round(val / 1000) + 'k';
            return String(val);
          }
        }
      },
      colors: ['#3b82f6'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%',
          borderRadius: 2,
          distributed: false,
          barHeight: '70%',
          rangeBarOverlap: false
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      tooltip: {
        custom: ({ series: seriesData, seriesIndex, dataPointIndex }: any) => {
          const seriesInfo = series[seriesIndex];
          const loanDetails = seriesInfo.details[dataPointIndex];

          if (!loanDetails) return '';

          const currency = (value: number) =>
            value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

          if (loanDetails.isRecurring) {
            return `
              <div style="background: white; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="font-weight: 600; margin-bottom: 4px;">${loanDetails.borrowerName}</div>
                <div style="font-size: 12px; color: #f59e0b; font-weight: 500; margin-bottom: 4px;">🔄 Juros Recorrente</div>
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Mês: ${chartData[dataPointIndex]}</div>
                <div style="font-size: 12px; color: #6b7280;">
                  <div>Juros do Mês: ${currency(loanDetails.profit)}</div>
                  <div>Taxa: ${loanDetails.rate}% ${loanDetails.periodRule?.toLowerCase()}</div>
                  <div style="margin-top: 4px; color: ${loanDetails.isPaid ? '#22c55e' : '#ef4444'}; font-weight: 500;">
                    ${loanDetails.isPaid ? '✅ Pago' : '⏳ Pendente'}
                  </div>
                </div>
              </div>
            `;
          }

          return `
            <div style="background: white; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="font-weight: 600; margin-bottom: 4px;">${loanDetails.borrowerName}</div>
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Vencimento: ${chartData[dataPointIndex]}</div>
              <div style="font-size: 12px; color: #6b7280;">
                <div>Principal: ${currency(loanDetails.principal)}</div>
                <div>Lucro: ${currency(loanDetails.profit)}</div>
                <div>Total: ${currency(loanDetails.total)}</div>
                <div>Taxa: ${loanDetails.rate}% ${loanDetails.periodRule?.toLowerCase()}</div>
                <div style="margin-top: 4px; color: ${loanDetails.isPaid ? '#22c55e' : '#3b82f6'}; font-weight: 500;">
                  ${loanDetails.isPaid ? '✅ Pago' : '📅 Pendente'}
                </div>
              </div>
            </div>
          `;
        }
      },
      grid: {
        strokeDashArray: 3
      }
    };

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new ApexCharts(chartRef.current, options);
    chartInstance.current.render();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartData, series, ApexCharts]);

  if (!ApexCharts) {
    return (
      <div style={{ width: '100%', height: 320 }} className="flex items-center justify-center">
        <div className="text-muted-foreground">Carregando gráfico...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">Empréstimos por mês</div>
      </div>
      <div ref={chartRef} />
    </div>
  );
}