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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Estados para período personalizado
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Chave para localStorage
  const STORAGE_KEY = 'monthlyEarningsChartPeriod';

  // Carregar configurações salvas do localStorage na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { useCustomPeriod: savedCustom, startDate: savedStart, endDate: savedEnd } = JSON.parse(saved);
          setUseCustomPeriod(savedCustom || false);
          if (savedStart) setStartDate(savedStart);
          if (savedEnd) setEndDate(savedEnd);
        }
      } catch (e) {
        console.error('Erro ao carregar configurações do gráfico:', e);
      }
      setIsInitialized(true);
    }
  }, []);

  // Inicializar datas padrão baseado na prop months (apenas se não houver dados salvos)
  useEffect(() => {
    if (!isInitialized) return;
    
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    if (!startDate) {
      setStartDate(`${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, '0')}`);
    }
    if (!endDate) {
      setEndDate(`${defaultEnd.getFullYear()}-${String(defaultEnd.getMonth() + 1).padStart(2, '0')}`);
    }
  }, [months, isInitialized]);

  // Salvar configurações no localStorage quando mudarem
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        useCustomPeriod,
        startDate,
        endDate,
      }));
    } catch (e) {
      console.error('Erro ao salvar configurações do gráfico:', e);
    }
  }, [useCustomPeriod, startDate, endDate, isInitialized]);

  // Load ApexCharts only on client side
  useEffect(() => {
    import('apexcharts').then((module) => {
      setApexCharts(() => module.default);
    });
  }, []);

  const { chartData, series } = useMemo(() => {
    const now = new Date();
    
    // Determinar período baseado no modo (padrão ou personalizado)
    let startWindow: Date;
    let endWindow: Date;
    
    if (useCustomPeriod && startDate && endDate) {
      const [startYear, startMonth] = startDate.split('-').map(Number);
      const [endYear, endMonth] = endDate.split('-').map(Number);
      startWindow = new Date(startYear, startMonth - 1, 1);
      endWindow = new Date(endYear, endMonth, 0, 23, 59, 59, 999);
    } else {
      startWindow = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      endWindow = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

    // Estrutura para armazenar dados por mês
    const monthsData: Record<string, { monthLabel: string; loans: any[] }> = {};
    const categories: string[] = [];

    // Calcular número de meses no intervalo
    const monthsCount = (endWindow.getFullYear() - startWindow.getFullYear()) * 12 + (endWindow.getMonth() - startWindow.getMonth()) + 1;

    // Inicializar todos os meses no intervalo
    for (let i = 0; i < monthsCount; i++) {
      const date = new Date(startWindow.getFullYear(), startWindow.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = monthFmt.format(date);
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { monthLabel, loans: [] };
      }
    }

    for (const loan of loans) {
      const borrowerName = loan.borrowerName || 'Sem nome';
      const principal = loan.amount || 0;

      // JUROS RECORRENTES - Buscar da tabela RecurringInterestPayment
      if (loan.recurringPayments && loan.recurringPayments.length > 0) {
        for (const payment of loan.recurringPayments) {
          const refMonth = new Date(payment.referenceMonth);
          
          // Verificar se está dentro do período do gráfico
          if (refMonth < startWindow || refMonth > endWindow) continue;
          
          const monthKey = `${refMonth.getFullYear()}-${String(refMonth.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = monthFmt.format(refMonth);
          
          if (!monthsData[monthKey]) {
            monthsData[monthKey] = { monthLabel, loans: [] };
          }

          monthsData[monthKey].loans.push({
            borrowerName,
            principal: 0,
            profit: payment.amount,
            total: payment.amount,
            rate: loan.interestRate || 0,
            periodRule: loan.periodRule || 'MENSAL',
            loanId: loan.idLoan,
            paymentId: payment.idPayment,
            isRecurring: true,
            isPaid: payment.isPaid,
            paidDate: payment.paidDate,
            referenceMonth: payment.referenceMonth
          });
        }
      }

      // JUROS NÃO RECORRENTES - Empréstimos sem juros recorrentes (mantém lógica original)
      if (!loan.isRecurringInterest) {
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
  }, [loans, months, useCustomPeriod, startDate, endDate]);

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
    <div style={{ width: '100%' }}>
      {/* Controles de Período */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="customPeriod"
            checked={useCustomPeriod}
            onChange={(e) => setUseCustomPeriod(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="customPeriod" className="text-sm font-medium text-gray-700">
            Período personalizado
          </label>
        </div>
        
        {useCustomPeriod && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">De:</label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Até:</label>
              <input
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        
        {!useCustomPeriod && (
          <span className="text-xs text-gray-500">
            Mostrando últimos {months} meses
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">Empréstimos por mês</div>
      </div>
      <div ref={chartRef} style={{ height: 320 }} />
    </div>
  );
}