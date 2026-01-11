"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFinancialSeries } from "@/services/financas.service";
import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}

function seriesTickFormatter(value: string) {
    const d = new Date(value + "T00:00:00Z");
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });
}

const chartConfig = {
    total: { label: "Total", color: "#8b5cf6" },
    unpaid: { label: "Empréstimos", color: "#f97316" },
    expenses: { label: "Despesas", color: "#ef4444" },
    income: { label: "Entradas", color: "#22c55e" },
    balance: { label: "Saldo", color: "#3b82f6" },
} satisfies ChartConfig;

type ChartKey = keyof typeof chartConfig;

export function FinanceLineChart() {
    const [data, setData] = React.useState<Array<{ date: string; total: number; unpaid: number; expenses: number; income: number; balance: number }>>([]);
    const [isolated, setIsolated] = React.useState<ChartKey | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedDays, setSelectedDays] = React.useState<string>("30");

    React.useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const numDays = parseInt(selectedDays, 10);
                const end = new Date();
                const start = addDays(new Date(end), -(numDays - 1));
                const params = { startDate: start.toISOString(), endDate: end.toISOString() };
                const series = await getFinancialSeries(params);
                const sorted = [...series].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
                setData(sorted.map((p) => ({
                    date: p.date,
                    total: p.balance + p.unpaid,
                    unpaid: p.unpaid,
                    expenses: p.expenses,
                    income: p.income,
                    balance: p.balance,
                })));
            } catch (e: any) {
                setError(e?.message || "Erro ao carregar dados do gráfico");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedDays]);

    const totals = React.useMemo(() => {
        const latest = data.length ? data[data.length - 1] : undefined;
        return {
            total: latest ? latest.total : 0,
            unpaid: latest ? latest.unpaid : 0,
            expenses: data.reduce((acc, curr) => acc + curr.expenses, 0),
            income: data.reduce((acc, curr) => acc + curr.income, 0),
            balance: latest ? latest.balance : 0,
        };
    }, [data]);

    return (
        <Card className="py-0">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 xl:flex-row ">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-6">
                    <CardTitle>Visão Financeira</CardTitle>
                    <CardDescription className="flex items-center justify-between gap-3">
                        <span>Gráfico de evolução financeira</span>
                        <Select value={selectedDays} onValueChange={setSelectedDays}>
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                                <SelectItem value="180">180 dias</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardDescription>
                </div>
                <div className="flex flex-wrap">
                    {(["total", "unpaid", "expenses", "income", "balance"] as const).map((key) => {
                        const chart = key as ChartKey;
                        const isIsolated = isolated === chart;
                        const isActive = isolated === null || isIsolated;
                        return (
                            <button
                                key={chart}
                                data-active={isActive}
                                data-isolated={isIsolated}
                                className="w-full data-[active=true]:bg-muted/50 data-[isolated=true]:bg-primary/10 data-[isolated=true]:border-primary/30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-5 min-w-[120px] transition-colors"
                                onClick={() => setIsolated(isIsolated ? null : chart)}
                            >
                                <span className="text-muted-foreground text-xs text-center break-words">{chartConfig[chart].label}</span>
                                <span className="text-base leading-none font-bold text-center w-full" style={{ color: chartConfig[chart].color }}>
                                    {totals[chart].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                {loading && <div className="flex items-center justify-center h-[250px] text-muted-foreground">Carregando...</div>}
                {error && <div className="flex items-center justify-center h-[250px] text-red-600">{error}</div>}
                {!loading && !error && (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                        <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={seriesTickFormatter} />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        className="w-[200px]"
                                        nameKey="views"
                                        labelFormatter={(value) => {
                                            const d = new Date(String(value) + "T00:00:00Z");
                                            return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" });
                                        }}
                                    />
                                }
                            />
                            {isolated ? (
                                <Line dataKey={isolated} type="monotone" stroke={chartConfig[isolated].color} strokeWidth={3} dot={false} />
                            ) : (
                                (["total", "unpaid", "expenses", "income", "balance"] as const).map((key) => (
                                    <Line key={key} dataKey={key} type="monotone" stroke={chartConfig[key].color} strokeWidth={2} dot={false} />
                                ))
                            )}
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
