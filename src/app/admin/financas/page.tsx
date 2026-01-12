'use client';

import { FinanceLineChart } from '@/components/financas/finance-line-chart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateUTC } from '@/lib/date';
import { getFinancialSummary, getTransactions } from '@/services/financas.service';
import { FinancialSummary, Transaction } from '@/types/financas.types';
import { AlertCircle, Loader, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function FinancasPage() {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [summaryData, transData] = await Promise.all([
                getFinancialSummary(),
                getTransactions(),
            ]);
            setSummary(summaryData);
            setRecentTransactions(transData.slice(0, 5));
        } catch (err) {
            setError('Erro ao carregar dados financeiros');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-2 sm:space-y-6 p-2 sm:p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finanças</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie suas transações e despesas
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin/financas/importar">Importar Extrato</Link>
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Finance Line Chart */}
            <FinanceLineChart />

            {summary && (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    +{summary.totalIncome.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total de entradas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    -{summary.totalExpenses.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total de despesas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                                <Wallet className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {summary.balance.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Entradas - Despesas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Classificação</CardTitle>
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.classifiedCount}/{summary.totalTransactions}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Transações classificadas
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Category */}
                    {Object.keys(summary.byCategory).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Despesas por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(summary.byCategory).map(([category, amount]) => (
                                        <div key={category}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium">{category}</span>
                                                <span className="text-sm font-semibold">
                                                    {(amount as number).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{
                                                        width: `${((amount as number) / summary.totalExpenses) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Transactions */}
                    {recentTransactions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Transações Recentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentTransactions.map((transaction) => (
                                        <div
                                            key={transaction.idTransaction}
                                            className="flex items-center justify-between pb-4 border-b last:border-0"
                                        >
                                            <div className="flex-1">
                                                <p className="text-[12px] ssm:text-sm font-medium">{transaction.description}</p>
                                                <p className="text-[10px] ssm:text-xs text-muted-foreground">
                                                    {formatDateUTC(transaction.date)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-semibold ${transaction.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {transaction.value > 0 ? '+' : ''}
                                                    {transaction.value.toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                                {transaction.category && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {transaction.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* CTA */}
            {summary && summary.unclassifiedCount > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Você tem {summary.unclassifiedCount} transação(ões) para classificar</p>
                                <p className="text-sm text-muted-foreground">
                                    Complete a classificação para melhor análise financeira
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/admin/financas/classificar">
                                    Classificar Agora
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
