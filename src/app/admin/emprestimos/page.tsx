'use client';

import { LoanForm } from '@/components/LoanForm';
import MonthlyEarningsChart from '@/components/MonthlyEarningsChart';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateUTC } from '@/lib/date';
import {
    createLoanBatch,
    deleteLoan,
    deleteRecurringInterestPayment,
    generateRecurringInterest,
    getInterestEarnings,
    getLoans,
    getLoansSummary,
    markAsPaid,
    payRecurringInterest,
    reversePayment,
    reverseRecurringInterestPayment,
    updateLoan,
    updateRecurringInterestPayment,
} from '@/services/emprestimos.service';
import { getCategories } from '@/services/financas.service';
import { Loan, LoanSummary } from '@/types/emprestimos.types';
import { ExpenseCategory } from '@/types/financas.types';
import {
    AlertCircle,
    Calendar,
    Check,
    CheckCircle2,
    DollarSign,
    Edit,
    Edit2,
    Loader,
    NotepadTextDashed,
    Plus,
    RefreshCw,
    Trash2,
    TrendingUp,
    Undo2
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

export default function EmprestimosPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isPending, startTransition] = useTransition();
    const [summary, setSummary] = useState<LoanSummary | null>(null);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending');
    const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
    const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [interestEarnings, setInterestEarnings] = useState<any>(null);
    const [expandedRecurringLoan, setExpandedRecurringLoan] = useState<string | null>(null);
    const [processingRecurring, setProcessingRecurring] = useState<string | null>(null);
    const [editingRecurringPayment, setEditingRecurringPayment] = useState<{
        idPayment: string;
        loanId: string;
        amount: string;
        referenceMonth: string;
        notes: string;
    } | null>(null);
    const [isRecurringPaymentDialogOpen, setIsRecurringPaymentDialogOpen] = useState(false);
    const [transactionDetailsId, setTransactionDetailsId] = useState<string | null>(null);
    const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] = useState(false);
    const [newLoan, setNewLoan] = useState({
        borrowerName: '',
        items: [
            { amount: '', categoryId: '', dueDate: '', description: '', notes: '', interestRate: '', interestType: 'SIMPLE', createdAt: '', periodRule: 'MENSAL', marketReference: '', expectedProfit: '', isRecurringInterest: false, recurringInterestDay: '1' }
        ] as { amount: string; categoryId: string; dueDate: string; description: string; notes: string; interestRate: string; interestType: string; createdAt: string; periodRule: string; marketReference: string; expectedProfit: string; isRecurringInterest: boolean; recurringInterestDay: string }[],
        transactionId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [loansData, summaryData, catData, interestData] = await Promise.all([
                getLoans(),
                getLoansSummary(),
                getCategories(),
                getInterestEarnings(),
            ]);
            setLoans(loansData);
            setSummary(summaryData);
            setCategories(catData);
            setInterestEarnings(interestData);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro ao carregar empréstimos',
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate average interest rates
    const calculateAverageRates = useCallback(() => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

        // Filter loans from last month
        const lastMonthLoans = loans.filter(loan => {
            const createdAt = new Date(loan.createdAt);
            return createdAt >= lastMonth && loan.interestRate && loan.interestRate > 0;
        });

        // Filter loans from last year
        const lastYearLoans = loans.filter(loan => {
            const createdAt = new Date(loan.createdAt);
            return createdAt >= lastYear && loan.interestRate && loan.interestRate > 0;
        });

        // Calculate weighted average for last month
        let lastMonthTotalPrincipal = 0;
        let lastMonthWeightedRate = 0;
        lastMonthLoans.forEach(loan => {
            const principal = loan.amount || 0;
            const annualRate = loan.periodRule === 'MENSAL' ? (loan.interestRate || 0) * 12 : (loan.interestRate || 0);
            lastMonthTotalPrincipal += principal;
            lastMonthWeightedRate += annualRate * principal;
        });

        // Calculate weighted average for last year
        let lastYearTotalPrincipal = 0;
        let lastYearWeightedRate = 0;
        lastYearLoans.forEach(loan => {
            const principal = loan.amount || 0;
            const annualRate = loan.periodRule === 'MENSAL' ? (loan.interestRate || 0) * 12 : (loan.interestRate || 0);
            lastYearTotalPrincipal += principal;
            lastYearWeightedRate += annualRate * principal;
        });

        return {
            lastMonthAvg: lastMonthTotalPrincipal > 0 ? Math.round((lastMonthWeightedRate / lastMonthTotalPrincipal) * 100) / 100 : 0,
            lastYearAvg: lastYearTotalPrincipal > 0 ? Math.round((lastYearWeightedRate / lastYearTotalPrincipal) * 100) / 100 : 0,
            lastMonthCount: lastMonthLoans.length,
            lastYearCount: lastYearLoans.length
        };
    }, [loans]);

    const averageRates = useCallback(() => calculateAverageRates(), [calculateAverageRates])();

    const resetForm = () => {
        setNewLoan({
            borrowerName: '',
            items: [{ amount: '', categoryId: '', dueDate: '', description: '', notes: '', interestRate: '', interestType: 'SIMPLE', createdAt: '', periodRule: 'MENSAL', marketReference: '', expectedProfit: '', isRecurringInterest: false, recurringInterestDay: '1' }],
            transactionId: '',
        });
    };

    const calculateMonthsDuration = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let months = 0;
        let currentDate = new Date(start);

        while (currentDate < end) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            if (currentDate <= end) months++;
        }

        if (months === 0) {
            const days = Math.abs(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            return days / 30;
        }
        return Math.abs(months);
    };

    const calculateSimpleInterest = (principal: number, monthlyRate: number, months: number): number => {
        return principal * (monthlyRate / 100) * months;
    };

    const calculateCompoundInterest = (principal: number, monthlyRate: number, months: number): number => {
        const amount = principal * Math.pow(1 + monthlyRate / 100, months);
        return amount - principal;
    };

    const calculateProfit = (idx: number) => {
        const item = newLoan.items[idx];
        if (!item.amount || !item.interestRate || !item.dueDate || !item.createdAt) return;

        const principal = parseFloat(item.amount);
        const annualRate = parseFloat(item.interestRate);
        const months = calculateMonthsDuration(item.createdAt, item.dueDate);

        // Converter para taxa mensal
        const monthlyRate = item.periodRule === 'ANUAL' ? annualRate / 12 : annualRate;

        let profit = 0;
        if (item.interestType === 'SIMPLE') {
            profit = calculateSimpleInterest(principal, monthlyRate, months);
        } else {
            profit = calculateCompoundInterest(principal, monthlyRate, months);
        }

        const items = [...newLoan.items];
        items[idx].expectedProfit = profit.toFixed(2);
        setNewLoan({ ...newLoan, items });
    };

    const handleCreateLoan = useCallback(async () => {
        if (!newLoan.borrowerName || newLoan.items.length === 0) {
            setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' });
            return;
        }
        for (const item of newLoan.items) {
            if (!item.amount || !item.categoryId || !item.dueDate) {
                setMessage({ type: 'error', text: 'Informe valor, categoria e data para cada parcela' });
                return;
            }
        }

        try {
            setCreating(true);
            // Transform data in non-blocking way
            const itemsData = newLoan.items.map(i => ({
                amount: parseFloat(i.amount),
                categoryId: i.categoryId,
                dueDate: new Date(i.dueDate),
                description: i.description || undefined,
                notes: i.notes || undefined,
                interestRate: i.interestRate ? parseFloat(i.interestRate) : undefined,
                interestType: i.interestRate ? i.interestType : undefined,
                periodRule: i.interestRate ? i.periodRule : undefined,
                marketReference: i.marketReference ? parseFloat(i.marketReference) : undefined,
                expectedProfit: i.expectedProfit ? parseFloat(i.expectedProfit) : undefined,
                isRecurringInterest: i.isRecurringInterest || false,
                recurringInterestDay: i.recurringInterestDay ? parseInt(i.recurringInterestDay, 10) : undefined,
                createdAt: i.createdAt ? new Date(i.createdAt) : undefined,
            }));

            await createLoanBatch({
                borrowerName: newLoan.borrowerName,
                transactionId: newLoan.transactionId || undefined,
                items: itemsData,
            });
            startTransition(async () => {
                await loadData();
                startTransition(() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                });
            });
            setMessage({ type: 'success', text: 'Empréstimo criado com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao criar empréstimo',
            });
        } finally {
            setCreating(false);
        }
    }, [newLoan, startTransition]);

    const handleEditLoan = useCallback((loan: Loan) => {
        setEditingLoanId(loan.idLoan);
        setNewLoan({
            borrowerName: loan.borrowerName,
            items: [{
                amount: loan.amount.toString(),
                categoryId: loan.categoryId || '',
                dueDate: new Date(loan.dueDate).toISOString().split('T')[0],
                description: loan.description || '',
                notes: loan.notes || '',
                interestRate: loan.interestRate?.toString() || '',
                interestType: loan.interestType || 'SIMPLE',
                createdAt: new Date(loan.createdAt).toISOString().split('T')[0],
                periodRule: loan.periodRule || 'MENSAL',
                marketReference: loan.marketReference?.toString() || '',
                expectedProfit: loan.expectedProfit?.toString() || '',
                isRecurringInterest: loan.isRecurringInterest || false,
                recurringInterestDay: loan.recurringInterestDay?.toString() || '1',
            }],
            transactionId: loan.transactionId || '',
        });
        setIsEditDialogOpen(true);
    }, []);

    const handleSaveEditLoan = useCallback(async () => {
        if (!editingLoanId || !newLoan.borrowerName || newLoan.items.length === 0) {
            setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' });
            return;
        }
        const item = newLoan.items[0];
        if (!item.amount || !item.categoryId || !item.dueDate) {
            setMessage({ type: 'error', text: 'Informe valor, categoria e data' });
            return;
        }

        try {
            setCreating(true);
            const loanUpdateData = {
                borrowerName: newLoan.borrowerName,
                amount: parseFloat(newLoan.items[0].amount),
                categoryId: newLoan.items[0].categoryId,
                dueDate: new Date(newLoan.items[0].dueDate),
                description: newLoan.items[0].description || undefined,
                notes: newLoan.items[0].notes || undefined,
                interestRate: newLoan.items[0].interestRate ? parseFloat(newLoan.items[0].interestRate) : undefined,
                interestType: newLoan.items[0].interestRate ? newLoan.items[0].interestType : undefined,
                periodRule: newLoan.items[0].interestRate ? newLoan.items[0].periodRule : undefined,
                marketReference: newLoan.items[0].marketReference ? parseFloat(newLoan.items[0].marketReference) : undefined,
                expectedProfit: newLoan.items[0].expectedProfit ? parseFloat(newLoan.items[0].expectedProfit) : undefined,
                isRecurringInterest: newLoan.items[0].isRecurringInterest || false,
                recurringInterestDay: newLoan.items[0].recurringInterestDay ? parseInt(newLoan.items[0].recurringInterestDay, 10) : undefined,
                createdAt: newLoan.items[0].createdAt ? new Date(newLoan.items[0].createdAt) : undefined,
            };
            // For editing, we will update only the first item fields (single loan)
            await updateLoan(editingLoanId, loanUpdateData);
            startTransition(async () => {
                await loadData();
                startTransition(() => {
                    setIsEditDialogOpen(false);
                    setEditingLoanId(null);
                    resetForm();
                });
            });
            setMessage({ type: 'success', text: 'Empréstimo atualizado com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao atualizar empréstimo',
            });
        } finally {
            setCreating(false);
        }
    }, [editingLoanId, newLoan, startTransition]);

    const handleMarkAsPaid = useCallback(async (id: string) => {
        try {
            setCreating(true);
            await markAsPaid(id);
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Empréstimo marcado como pago' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao marcar como pago',
            });
        } finally {
            setCreating(false);
        }
    }, [startTransition]);

    const handleReversePayment = useCallback(async (id: string) => {
        try {
            setCreating(true);
            await reversePayment(id);
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Pagamento estornado com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao estornar pagamento',
            });
        } finally {
            setCreating(false);
        }
    }, [startTransition]);

    // ============ JUROS RECORRENTES HANDLERS ============

    const handleGenerateRecurringInterest = useCallback(async (loanId: string, monthsAhead: number = 1) => {
        try {
            setProcessingRecurring(loanId);
            await generateRecurringInterest(loanId, monthsAhead);
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Parcelas de juros geradas com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao gerar parcelas de juros',
            });
        } finally {
            setProcessingRecurring(null);
        }
    }, [startTransition]);

    const handlePayRecurringInterest = useCallback(async (loanId: string, referenceMonth: Date, amount?: number) => {
        try {
            setProcessingRecurring(loanId);
            await payRecurringInterest({
                loanId,
                referenceMonth,
                amount,
            });
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Juros recorrente pago com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao pagar juros recorrente',
            });
        } finally {
            setProcessingRecurring(null);
        }
    }, [startTransition]);

    const handleReverseRecurringPayment = useCallback(async (paymentId: string, loanId: string) => {
        try {
            setProcessingRecurring(loanId);
            await reverseRecurringInterestPayment(paymentId);
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Pagamento de juros estornado com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao estornar pagamento de juros',
            });
        } finally {
            setProcessingRecurring(null);
        }
    }, [startTransition]);

    const handleDeleteRecurringPayment = useCallback(async (paymentId: string, loanId: string) => {
        try {
            setProcessingRecurring(loanId);
            await deleteRecurringInterestPayment(paymentId);
            startTransition(() => loadData());
            setMessage({ type: 'success', text: 'Parcela de juros excluída com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao excluir parcela de juros',
            });
        } finally {
            setProcessingRecurring(null);
        }
    }, [startTransition]);

    const handleEditRecurringPayment = useCallback((payment: any, loanId: string) => {
        const refMonth = new Date(payment.referenceMonth);
        setEditingRecurringPayment({
            idPayment: payment.idPayment,
            loanId,
            amount: payment.amount.toString(),
            referenceMonth: `${refMonth.getFullYear()}-${String(refMonth.getMonth() + 1).padStart(2, '0')}`,
            notes: payment.notes || '',
        });
        setIsRecurringPaymentDialogOpen(true);
    }, []);

    const handleSaveRecurringPayment = useCallback(async () => {
        if (!editingRecurringPayment) return;

        try {
            setProcessingRecurring(editingRecurringPayment.loanId);
            const [year, month] = editingRecurringPayment.referenceMonth.split('-').map(Number);
            await updateRecurringInterestPayment(editingRecurringPayment.idPayment, {
                amount: parseFloat(editingRecurringPayment.amount),
                referenceMonth: new Date(year, month - 1, 1),
                notes: editingRecurringPayment.notes || undefined,
            });
            startTransition(() => loadData());
            setIsRecurringPaymentDialogOpen(false);
            setEditingRecurringPayment(null);
            setMessage({ type: 'success', text: 'Parcela de juros atualizada com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao atualizar parcela de juros',
            });
        } finally {
            setProcessingRecurring(null);
        }
    }, [editingRecurringPayment, startTransition]);

    const handleDeleteClick = useCallback((loanId: string) => {
        setDeletingLoanId(loanId);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingLoanId) return;

        try {
            setCreating(true);
            await deleteLoan(deletingLoanId);
            startTransition(async () => {
                await loadData();
                startTransition(() => {
                    setIsDeleteDialogOpen(false);
                    setDeletingLoanId(null);
                });
            });
            setMessage({ type: 'success', text: 'Empréstimo deletado com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao deletar empréstimo',
            });
        } finally {
            setCreating(false);
        }
    }, [deletingLoanId, startTransition]);


    const filteredLoans = loans.filter((loan) => {
        if (filter === 'pending') return !loan.isPaid;
        if (filter === 'paid') return loan.isPaid;
        return true;
    });

    // Calcular juros recorrentes vencidos e próximos
    const recurringInterestData = useMemo(() => {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const overdueRecurring: Array<{
            loanId: string;
            borrowerName: string;
            amount: number;
            referenceMonth: Date;
            paymentId: string;
        }> = [];

        const upcomingRecurring: Array<{
            loanId: string;
            borrowerName: string;
            amount: number;
            referenceMonth: Date;
            dueDay: number;
            paymentId: string;
        }> = [];

        for (const loan of loans) {
            if (!loan.recurringPayments || loan.isPaid) continue;

            for (const payment of loan.recurringPayments) {
                if (payment.isPaid) continue;

                const refMonth = new Date(payment.referenceMonth);
                const dueDay = loan.recurringInterestDay || 1;
                const dueDate = new Date(refMonth.getFullYear(), refMonth.getMonth(), dueDay);

                // Vencidos: meses anteriores ao atual OU mês atual mas dia já passou
                if (refMonth < currentMonth || (refMonth.getMonth() === now.getMonth() && refMonth.getFullYear() === now.getFullYear() && dueDay < now.getDate())) {
                    overdueRecurring.push({
                        loanId: loan.idLoan,
                        borrowerName: loan.borrowerName,
                        amount: payment.amount,
                        referenceMonth: refMonth,
                        paymentId: payment.idPayment,
                    });
                }
                // Próximos: mês atual ou próximo e dentro dos próximos 7 dias
                else if (dueDate >= now && dueDate <= next7Days) {
                    upcomingRecurring.push({
                        loanId: loan.idLoan,
                        borrowerName: loan.borrowerName,
                        amount: payment.amount,
                        referenceMonth: refMonth,
                        dueDay,
                        paymentId: payment.idPayment,
                    });
                }
            }
        }

        // Ordenar por data
        overdueRecurring.sort((a, b) => a.referenceMonth.getTime() - b.referenceMonth.getTime());
        upcomingRecurring.sort((a, b) => a.referenceMonth.getTime() - b.referenceMonth.getTime());

        return { overdueRecurring, upcomingRecurring };
    }, [loans]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="sm:space-y-6 space-y-2 p-2 sm:p-6">
            <div className="flex flex-wrap sm:space-y-6 space-y-2 justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empréstimos</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie dinheiro emprestado e cobranças
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Empréstimo
                </Button>
            </div>

            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            {summary && (
                <>
                    <div className="grid sm:gap-6 gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Emprestado</CardTitle>
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {summary.totalLoaned.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Pendente de cobrança
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {summary.totalPaid.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total pago
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Não Linkados</CardTitle>
                                <DollarSign className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">
                                    {(summary.unlinkedAmount || 0).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {summary.unlinkedCount || 0} empréstimo(s) sem link
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Empréstimos</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {summary.totalLoans}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {summary.paidLoans} pago(s)
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vencendo em 7 dias</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {summary.upcomingPayments.length}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cobranças próximas
                                </p>
                                <p className="text-xs text-red-700 font-semibold mt-1">
                                    {(summary.upcomingAmount7Days || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vencidos (Qtd / Valor)</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-700" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-700">
                                    {summary.overdueCount || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Quantidade vencida
                                </p>
                                <p className="text-xs text-red-800 font-semibold mt-1">
                                    {(summary.overdueAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Rendimentos de Juros */}
                    {interestEarnings && interestEarnings.totalInterest > 0 && (
                        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Rendimentos de Juros</CardTitle>
                                    <CardDescription>Juros acumulados nos empréstimos</CardDescription>
                                </div>
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:space-y-6 space-y-2 grid-cols-1 md:grid-cols-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Principal Total</p>
                                        <p className="text-2xl font-bold text-emerald-700">
                                            {interestEarnings.totalPrincipal.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Rendimento de Juros</p>
                                        <p className="text-2xl font-bold text-teal-600">
                                            {interestEarnings.totalInterest.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Montante Total</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {interestEarnings.totalAmount.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Taxas Médias */}
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-semibold mb-3">Taxas de Juros Médias</p>
                                    <div className="grid gap-3 grid-cols-2">
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-600">Último Mês</p>
                                            <p className="text-lg font-semibold text-emerald-600">
                                                {averageRates.lastMonthAvg > 0 ? `${averageRates.lastMonthAvg}% a.a.` : 'N/A'}
                                            </p>
                                            {averageRates.lastMonthAvg > 0 && (
                                                <p className="text-sm text-emerald-500">
                                                    {Math.round((averageRates.lastMonthAvg / 12) * 100) / 100}% a.m.
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {averageRates.lastMonthCount} empréstimo(s)
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-600">Último Ano</p>
                                            <p className="text-lg font-semibold text-teal-600">
                                                {averageRates.lastYearAvg > 0 ? `${averageRates.lastYearAvg}% a.a.` : 'N/A'}
                                            </p>
                                            {averageRates.lastYearAvg > 0 && (
                                                <p className="text-sm text-teal-500">
                                                    {Math.round((averageRates.lastYearAvg / 12) * 100) / 100}% a.m.
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {averageRates.lastYearCount} empréstimo(s)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <MonthlyEarningsChart loans={loans} months={9} />
                                </div>
                                {interestEarnings.byType.simple.interest > 0 || interestEarnings.byType.compound.interest > 0 ? (
                                    <div className="mt-6 pt-4 border-t">
                                        <p className="text-sm font-semibold mb-3">Detalhamento por Tipo</p>
                                        <div className="grid gap-3 grid-cols-2">
                                            {interestEarnings.byType.simple.interest > 0 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">Juros Simples</p>
                                                    <p className="text-lg font-semibold text-emerald-600">
                                                        {interestEarnings.byType.simple.interest.toLocaleString('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                            {interestEarnings.byType.compound.interest > 0 && (
                                                <div className="bg-white p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">Juros Compostos</p>
                                                    <p className="text-lg font-semibold text-teal-600">
                                                        {interestEarnings.byType.compound.interest.toLocaleString('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}

                                {/* Rendimento do Mês Atual */}
                                {(interestEarnings.currentMonthRecurringInterest > 0 || interestEarnings.currentMonthNonRecurringInterest > 0) && (
                                    <div className="mt-6 pt-4 border-t gap-2 sm:gap-6">
                                        <p className="text-sm font-semibold mb-3">📊 Rendimento do Mês Atual</p>
                                        <div className="grid gap-3 grid-cols-2">
                                            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                                                <p className="text-xs text-purple-700">Juros Recorrentes</p>
                                                <p className="text-lg font-semibold text-purple-600">
                                                    {(interestEarnings.currentMonthRecurringInterest || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
                                                <p className="text-xs text-indigo-700">Rendimento Sem Recorrência</p>
                                                <p className="text-lg font-semibold text-indigo-600">
                                                    {(interestEarnings.currentMonthNonRecurringInterest || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg col-span-2">
                                                <p className="text-xs text-purple-700">Total Juros</p>
                                                <p className="text-lg font-semibold text-purple-600">
                                                    {(interestEarnings.currentMonthRecurringInterest + interestEarnings.currentMonthNonRecurringInterest).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Juros Recorrentes */}
                                {(interestEarnings.recurringInterestPaid > 0 || interestEarnings.recurringInterestPending > 0) && (
                                    <div className="mt-6 pt-4 border-t">
                                        <p className="text-sm font-semibold mb-3">💰 Juros Recorrentes (Total)</p>
                                        <div className="grid gap-3 grid-cols-3">
                                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                                <p className="text-xs text-green-700">Recebido</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {(interestEarnings.recurringInterestPaid || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                                <p className="text-xs text-amber-700">Pendente</p>
                                                <p className="text-lg font-semibold text-amber-600">
                                                    {(interestEarnings.recurringInterestPending || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                                <p className="text-xs text-blue-700">Total</p>
                                                <p className="text-lg font-semibold text-blue-600">
                                                    {(interestEarnings.totalRecurringInterest || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Empréstimos por Categoria */}
                    {summary.byCategory && Object.keys(summary.byCategory).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Empréstimos por Categoria</CardTitle>
                                <CardDescription>Valores pendentes agrupados por categoria</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(summary.byCategory)
                                        .sort(([, a], [, b]) => (b as number) - (a as number))
                                        .map(([category, amount]) => (
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
                                                        className="bg-primary h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${Math.min(((amount as number) / summary.totalLoaned) * 100, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Overdue Loans */}
                    {((summary && summary.overdueLoans && summary.overdueLoans.length > 0) || recurringInterestData.overdueRecurring.length > 0) && (
                        <Card className="border-red-400 bg-red-100">
                            <CardHeader>
                                <CardTitle className="text-red-800">⚠️ Empréstimos Vencidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {summary?.overdueLoans?.map((loan: Loan) => (
                                        <div key={loan.idLoan} className="flex items-center justify-between pb-2 border-b border-red-300 last:border-0">
                                            <div>
                                                <p className="font-medium text-red-900">{loan.borrowerName}</p>
                                                <p className="text-sm text-red-700">
                                                    Vencido em {formatDateUTC(loan.dueDate)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-red-800">
                                                {loan.amount.toLocaleString('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                    {recurringInterestData.overdueRecurring.length > 0 && (
                                        <>
                                            {summary?.overdueLoans?.length > 0 && (
                                                <div className="border-t border-red-300 pt-2 mt-2">
                                                    <p className="text-xs font-semibold text-red-700 mb-2">📅 Juros Recorrentes Atrasados</p>
                                                </div>
                                            )}
                                            {!summary?.overdueLoans?.length && (
                                                <p className="text-xs font-semibold text-red-700 mb-2">📅 Juros Recorrentes Atrasados</p>
                                            )}
                                            {recurringInterestData.overdueRecurring.map((item) => (
                                                <div key={item.paymentId} className="flex items-center justify-between pb-2 border-b border-red-300 last:border-0">
                                                    <div>
                                                        <p className="font-medium text-red-900">{item.borrowerName}</p>
                                                        <p className="text-sm text-red-700">
                                                            Ref: {item.referenceMonth.getMonth() + 1}/{item.referenceMonth.getFullYear()}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-red-800">
                                                        {item.amount.toLocaleString('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        })}
                                                    </p>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming Payments */}
                    {(summary.upcomingPayments.length > 0 || recurringInterestData.upcomingRecurring.length > 0) && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle>Cobranças Próximas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {summary.upcomingPayments.map((loan) => (
                                        <div key={loan.idLoan} className="flex items-center justify-between pb-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{loan.borrowerName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDateUTC(loan.dueDate)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-orange-600">
                                                {loan.amount.toLocaleString('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                    {recurringInterestData.upcomingRecurring.length > 0 && (
                                        <>
                                            {summary.upcomingPayments.length > 0 && (
                                                <div className="border-t pt-2 mt-2">
                                                    <p className="text-xs font-semibold text-orange-700 mb-2">📅 Juros Recorrentes Próximos</p>
                                                </div>
                                            )}
                                            {summary.upcomingPayments.length === 0 && (
                                                <p className="text-xs font-semibold text-orange-700 mb-2">📅 Juros Recorrentes Próximos</p>
                                            )}
                                            {recurringInterestData.upcomingRecurring.map((item) => (
                                                <div key={item.paymentId} className="flex items-center justify-between pb-2 border-b last:border-0">
                                                    <div>
                                                        <p className="font-medium">{item.borrowerName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Dia {item.dueDay} - Ref: {item.referenceMonth.getMonth() + 1}/{item.referenceMonth.getFullYear()}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-orange-600">
                                                        {item.amount.toLocaleString('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        })}
                                                    </p>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    Todos
                </Button>
                <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                >
                    Pendentes ({loans.filter(l => !l.isPaid).length})
                </Button>
                <Button
                    variant={filter === 'paid' ? 'default' : 'outline'}
                    onClick={() => setFilter('paid')}
                >
                    Pagos ({loans.filter(l => l.isPaid).length})
                </Button>
            </div>

            {/* Loans List */}
            <div className="grid sm:space-y-6 space-y-2">
                {filteredLoans.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-muted-foreground">
                            Nenhum empréstimo nesta categoria
                        </CardContent>
                    </Card>
                ) : (
                    filteredLoans.map((loan) => (
                        <Card key={loan.idLoan}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{loan.borrowerName}</CardTitle>
                                        <CardDescription>
                                            {formatDateUTC(loan.dueDate)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {loan.transactionId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 w-6 p-0 hover:bg-sky-100 text-sky-700 border-sky-300 hover:border-sky-400"
                                                onClick={() => {
                                                    setTransactionDetailsId(loan.transactionId!);
                                                    setIsTransactionDetailsOpen(true);
                                                }}
                                                title="Ver detalhes da transação"
                                            >
                                                <NotepadTextDashed className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Badge variant={loan.isPaid ? 'secondary' : 'default'}>
                                            {loan.isPaid ? 'Pago' : 'Pendente'}
                                        </Badge>
                                        {loan.isRecurringInterest && (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                                🔄 Juros Recorrentes
                                            </Badge>
                                        )}
                                        <Badge variant="outline">{loan.category?.name || 'Sem categoria'}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Informações Principais */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-muted-foreground">Valor Principal</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {loan.amount.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-muted-foreground">Taxa de Juros</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {loan.interestRate ? `${loan.interestRate}%` : '0%'}
                                            <span className="text-xs font-normal text-muted-foreground ml-1">
                                                {loan.periodRule === 'ANUAL' ? 'a.a.' : 'a.m.'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Rendimento e Total */}
                                {!!loan.interestRate && loan.interestRate > 0 && !!loan.expectedProfit && loan.expectedProfit > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-xs text-green-600">Rendimento</p>
                                                <p className="font-bold text-green-700">
                                                    {(() => {
                                                        const principal = loan.amount || 0;
                                                        const rate = loan.interestRate || 0;
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

                                                        const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;
                                                        let profit = 0;
                                                        if (interestType === 'SIMPLE') {
                                                            profit = principal * (monthlyRate / 100) * monthsDur;
                                                        } else {
                                                            const amount = principal * Math.pow(1 + monthlyRate / 100, monthsDur);
                                                            profit = amount - principal;
                                                        }
                                                        return profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                                    })()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600">Total a Receber</p>
                                                <p className="font-bold text-blue-700">
                                                    {(() => {
                                                        const principal = loan.amount || 0;
                                                        const rate = loan.interestRate || 0;
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

                                                        const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;
                                                        let total = principal;
                                                        if (interestType === 'SIMPLE') {
                                                            total = principal + (principal * (monthlyRate / 100) * monthsDur);
                                                        } else {
                                                            total = principal * Math.pow(1 + monthlyRate / 100, monthsDur);
                                                        }
                                                        return total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                                    })()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-600">Tipo</p>
                                                <p className="font-bold text-purple-700 text-sm">
                                                    {loan.interestType === 'COMPOUND' ? 'Composto' : 'Simples'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-green-200 flex justify-between text-xs text-gray-600">
                                            <span>📅 Criado: {formatDateUTC(loan.createdAt)}</span>
                                            <span>⏰ Duração: {(() => {
                                                const start = new Date(loan.createdAt);
                                                const end = loan.isPaid && loan.paidDate ? new Date(loan.paidDate) : new Date(loan.dueDate);
                                                let months = 0;
                                                let cur = new Date(start);
                                                while (cur < end) {
                                                    cur.setMonth(cur.getMonth() + 1);
                                                    if (cur <= end) months++;
                                                }
                                                if (months === 0) {
                                                    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                    return `${days} dias`;
                                                }
                                                return `${months} ${months === 1 ? 'mês' : 'meses'}`;
                                            })()}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Juros Recorrentes Info */}
                                {loan.isRecurringInterest && loan.interestRate && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-amber-800">💰 Juros Recorrentes</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-amber-600">
                                                    Dia {loan.recurringInterestDay || 1} de cada mês
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-amber-100 text-amber-700 border-amber-700 hover:border-amber-800"
                                                    onClick={() => setExpandedRecurringLoan(
                                                        expandedRecurringLoan === loan.idLoan ? null : loan.idLoan
                                                    )}
                                                >
                                                    <Calendar className="h-4 w-4 text-amber-700" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white rounded p-2">
                                                <p className="text-xs text-gray-500">Mensal</p>
                                                <p className="font-bold text-amber-700">
                                                    {(loan.amount * ((loan.periodRule === 'ANUAL' ? loan.interestRate / 12 : loan.interestRate) / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded p-2">
                                                <p className="text-xs text-gray-500">Recebido</p>
                                                <p className="font-bold text-green-600">
                                                    {(loan.recurringInterestPaid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded p-2">
                                                <p className="text-xs text-gray-500">Pendente</p>
                                                <p className="font-bold text-red-600">
                                                    {(loan.recurringInterestPending || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botões de Ação Rápida */}
                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400 hover:text-amber-600"
                                                disabled={processingRecurring === loan.idLoan}
                                                onClick={() => handleGenerateRecurringInterest(loan.idLoan, 3)}
                                            >
                                                {processingRecurring === loan.idLoan ? (
                                                    <Loader className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                )}
                                                Gerar Próx. 3 Meses
                                            </Button>
                                        </div>

                                        {/* Seção Expandida - Lista de Parcelas */}
                                        {expandedRecurringLoan === loan.idLoan && (
                                            <div className="mt-4 pt-3 border-t border-amber-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-semibold text-amber-800">📅 Parcelas de Juros</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs h-7 border-green-300 text-green-700 hover:bg-green-100"
                                                        disabled={processingRecurring === loan.idLoan}
                                                        onClick={() => handleGenerateRecurringInterest(loan.idLoan, 6)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Gerar 6 Meses
                                                    </Button>
                                                </div>

                                                {/* Lista de Parcelas */}
                                                {loan.recurringPayments && loan.recurringPayments.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {/* Pendentes primeiro */}
                                                        {loan.recurringPayments.filter(p => !p.isPaid).length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-red-700 mb-2">⏳ Pendentes</p>
                                                                <div className="space-y-2 max-h-48 overflow-y-auto scrollable">
                                                                    {[...loan.recurringPayments]
                                                                        .filter(p => !p.isPaid)
                                                                        .sort((a, b) => new Date(a.referenceMonth).getTime() - new Date(b.referenceMonth).getTime())
                                                                        .map((payment) => {
                                                                            const refMonth = new Date(payment.referenceMonth);
                                                                            const monthName = refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                                                            const isCurrentMonth = refMonth.getMonth() === new Date().getMonth() && refMonth.getFullYear() === new Date().getFullYear();
                                                                            const isPastDue = refMonth < new Date() && !isCurrentMonth;

                                                                            return (
                                                                                <div
                                                                                    key={payment.idPayment}
                                                                                    className={`flex items-center justify-between p-2 rounded border ${isPastDue
                                                                                        ? 'bg-red-50 border-red-300'
                                                                                        : isCurrentMonth
                                                                                            ? 'bg-yellow-50 border-yellow-300'
                                                                                            : 'bg-white border-gray-200'
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className="text-sm font-medium capitalize">
                                                                                                {monthName}
                                                                                            </p>
                                                                                            {isCurrentMonth && (
                                                                                                <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-400 text-yellow-800">
                                                                                                    Mês Atual
                                                                                                </Badge>
                                                                                            )}
                                                                                            {isPastDue && (
                                                                                                <Badge variant="outline" className="text-xs bg-red-100 border-red-400 text-red-700">
                                                                                                    Atrasado
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <p className="text-sm font-bold text-amber-700 mr-2">
                                                                                            {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                                        </p>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            className="h-7 w-7 p-0 border-green-300 text-green-700 hover:bg-green-100"
                                                                                            disabled={processingRecurring === loan.idLoan}
                                                                                            onClick={() => handlePayRecurringInterest(loan.idLoan, new Date(payment.referenceMonth), payment.amount)}
                                                                                            title="Marcar como pago"
                                                                                        >
                                                                                            {processingRecurring === loan.idLoan ? (
                                                                                                <Loader className="h-3 w-3 animate-spin" />
                                                                                            ) : (
                                                                                                <Check className="h-3 w-3" />
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                                                            disabled={processingRecurring === loan.idLoan}
                                                                                            onClick={() => handleEditRecurringPayment(payment, loan.idLoan)}
                                                                                            title="Editar parcela"
                                                                                        >
                                                                                            <Edit2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                                                            disabled={processingRecurring === loan.idLoan}
                                                                                            onClick={() => handleDeleteRecurringPayment(payment.idPayment, loan.idLoan)}
                                                                                            title="Excluir parcela"
                                                                                        >
                                                                                            {processingRecurring === loan.idLoan ? (
                                                                                                <Loader className="h-3 w-3 animate-spin" />
                                                                                            ) : (
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            )}
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Pagas */}
                                                        {loan.recurringPayments.filter(p => p.isPaid).length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-green-700 mb-2">✅ Pagas</p>
                                                                <div className="space-y-2 max-h-48 overflow-y-auto scrollable">
                                                                    {[...loan.recurringPayments]
                                                                        .filter(p => p.isPaid)
                                                                        .sort((a, b) => new Date(b.referenceMonth).getTime() - new Date(a.referenceMonth).getTime())
                                                                        .map((payment) => {
                                                                            const refMonth = new Date(payment.referenceMonth);
                                                                            const monthName = refMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

                                                                            return (
                                                                                <div
                                                                                    key={payment.idPayment}
                                                                                    className="flex items-center justify-between p-2 rounded border bg-green-50 border-green-200"
                                                                                >
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className="text-sm font-medium capitalize text-green-800">
                                                                                                {monthName}
                                                                                            </p>
                                                                                            <Badge variant="outline" className="text-xs bg-green-100 border-green-400 text-green-700">
                                                                                                <Check className="h-3 w-3 mr-1" />
                                                                                                Pago
                                                                                            </Badge>
                                                                                        </div>
                                                                                        {payment.paidDate && (
                                                                                            <p className="text-xs text-gray-500">
                                                                                                Pago em {formatDateUTC(payment.paidDate)}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1">
                                                                                        <p className="text-sm font-bold text-green-600 mr-2">
                                                                                            {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                                        </p>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                                                            disabled={processingRecurring === loan.idLoan}
                                                                                            onClick={() => handleEditRecurringPayment(payment, loan.idLoan)}
                                                                                            title="Editar parcela"
                                                                                        >
                                                                                            <Edit2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                                                                            disabled={processingRecurring === loan.idLoan}
                                                                                            onClick={() => handleReverseRecurringPayment(payment.idPayment, loan.idLoan)}
                                                                                            title="Estornar pagamento"
                                                                                        >
                                                                                            {processingRecurring === loan.idLoan ? (
                                                                                                <Loader className="h-3 w-3 animate-spin" />
                                                                                            ) : (
                                                                                                <Undo2 className="h-3 w-3" />
                                                                                            )}
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <p className="text-sm text-gray-500 mb-2">Nenhuma parcela gerada ainda</p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                                                            disabled={processingRecurring === loan.idLoan}
                                                            onClick={() => handleGenerateRecurringInterest(loan.idLoan, 3)}
                                                        >
                                                            {processingRecurring === loan.idLoan ? (
                                                                <Loader className="h-3 w-3 animate-spin mr-1" />
                                                            ) : (
                                                                <Plus className="h-3 w-3 mr-1" />
                                                            )}
                                                            Gerar Parcelas
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Resumo de Parcelas */}
                                                {loan.recurringPayments && loan.recurringPayments.length > 0 && (
                                                    <div className="mt-3 pt-2 border-t border-amber-200 grid grid-cols-2 gap-2 text-xs">
                                                        <div className="text-gray-600">
                                                            Total de Parcelas: <span className="font-bold">{loan.recurringPayments.length}</span>
                                                        </div>
                                                        <div className="text-gray-600 text-right">
                                                            Pagas: <span className="font-bold text-green-600">{loan.recurringPayments.filter(p => p.isPaid).length}</span>
                                                            {' / '}
                                                            Pendentes: <span className="font-bold text-red-600">{loan.recurringPayments.filter(p => !p.isPaid).length}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {loan.description && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Descrição:</p>
                                        <p className="text-sm">{loan.description}</p>
                                    </div>
                                )}
                                {loan.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Notas:</p>
                                        <p className="text-sm">{loan.notes}</p>
                                    </div>
                                )}
                                {loan.isPaid && loan.paidDate && (
                                    <div className="text-sm text-green-600">
                                        Pago em {loan.paidDate ? formatDateUTC(loan.paidDate) : ''}
                                    </div>
                                )}

                                {/* Mostrar linkagens de pagamento apenas para empréstimos pagos */}
                                {loan.isPaid && loan.payments && loan.payments.length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-900 mb-2">
                                            💰 Histórico de Pagamentos Recebidos
                                        </p>
                                        <div className="space-y-2">
                                            {loan.payments.map((payment) => (
                                                <div key={payment.idPayment} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-600">
                                                            {formatDateUTC(payment.createdAt)} às{' '}
                                                            {new Date(payment.createdAt).toLocaleTimeString('pt-BR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                        {payment.transaction && (
                                                            <p className="text-xs text-blue-700 mt-0.5">
                                                                📝 {payment.transaction.description}
                                                            </p>
                                                        )}
                                                        {payment.notes && (
                                                            <p className="text-xs text-gray-500 mt-0.5 italic">
                                                                {payment.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-3">
                                                        <p className="text-sm font-bold text-green-600">
                                                            {payment.amount.toLocaleString('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-blue-200">
                                            {/* Barra de Progresso */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-blue-800">Progresso de Recebimento</span>
                                                    <span className="text-xs font-bold text-green-700">
                                                        {((((loan.totalPaid || 0) / loan.amount) * 100)).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-600"
                                                        style={{
                                                            width: `${Math.min(((loan.totalPaid || 0) / loan.amount) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-blue-800">Total Recebido:</span>
                                                <span className="text-sm font-bold text-green-700">
                                                    {(loan.totalPaid || 0).toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {loan.remainingBalance && loan.remainingBalance > 0 && (
                                            <div className="mt-1 flex justify-between items-center">
                                                <span className="text-xs font-medium text-orange-700">Saldo Pendente:</span>
                                                <span className="text-sm font-bold text-orange-600">
                                                    {loan.remainingBalance.toLocaleString('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {loan.remainingBalance === 0 && (
                                            <div className="mt-2 text-center">
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                                    ✅ Empréstimo Totalmente Quitado
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    {!loan.isPaid && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditLoan(loan)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkAsPaid(loan.idLoan)}
                                                disabled={creating}
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Marcar Pago
                                            </Button>
                                        </>
                                    )}
                                    {loan.isPaid && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReversePayment(loan.idLoan)}
                                            disabled={creating}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Estornar Pagamento
                                        </Button>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteClick(loan.idLoan)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className='overflow-y-scroll h-5/6 p-2 sm:p-6 scrollable'>
                    <DialogHeader>
                        <DialogTitle>Novo Empréstimo</DialogTitle>
                        <DialogDescription>
                            Registre um novo empréstimo de dinheiro.
                        </DialogDescription>
                    </DialogHeader>
                    <LoanForm
                        formData={newLoan}
                        categories={categories}
                        onFormChange={setNewLoan}
                        onCalculateProfit={calculateProfit}
                        mode="create"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsCreateDialogOpen(false);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button onClick={handleCreateLoan} disabled={creating}>
                            {creating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Criar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className='overflow-y-scroll h-5/6 p-2 sm:p-6 scrollable'>
                    <DialogHeader>
                        <DialogTitle>Editar Empréstimo</DialogTitle>
                        <DialogDescription>
                            Atualize os detalhes do empréstimo.
                        </DialogDescription>
                    </DialogHeader>
                    <LoanForm
                        formData={newLoan}
                        categories={categories}
                        onFormChange={setNewLoan}
                        onCalculateProfit={calculateProfit}
                        mode="edit"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsEditDialogOpen(false);
                            setEditingLoanId(null);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button onClick={handleSaveEditLoan} disabled={creating}>
                            {creating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Atualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar Empréstimo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar este empréstimo? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={creating}
                        >
                            {creating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Deletar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog para Editar Parcela de Juros Recorrentes */}
            <Dialog open={isRecurringPaymentDialogOpen} onOpenChange={setIsRecurringPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Parcela de Juros</DialogTitle>
                        <DialogDescription>
                            Atualize os detalhes da parcela de juros recorrentes.
                        </DialogDescription>
                    </DialogHeader>
                    {editingRecurringPayment && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="recurring-amount">Valor</Label>
                                <Input
                                    id="recurring-amount"
                                    type="number"
                                    step="0.01"
                                    value={editingRecurringPayment.amount}
                                    onChange={(e) => setEditingRecurringPayment({
                                        ...editingRecurringPayment,
                                        amount: e.target.value,
                                    })}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recurring-month">Mês de Referência</Label>
                                <Input
                                    id="recurring-month"
                                    type="month"
                                    value={editingRecurringPayment.referenceMonth}
                                    onChange={(e) => setEditingRecurringPayment({
                                        ...editingRecurringPayment,
                                        referenceMonth: e.target.value,
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recurring-notes">Notas (opcional)</Label>
                                <Input
                                    id="recurring-notes"
                                    type="text"
                                    value={editingRecurringPayment.notes}
                                    onChange={(e) => setEditingRecurringPayment({
                                        ...editingRecurringPayment,
                                        notes: e.target.value,
                                    })}
                                    placeholder="Observações..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsRecurringPaymentDialogOpen(false);
                            setEditingRecurringPayment(null);
                        }}>Cancelar</Button>
                        <Button
                            onClick={handleSaveRecurringPayment}
                            disabled={processingRecurring !== null}
                        >
                            {processingRecurring !== null && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Details Dialog */}
            <TransactionDetailsDialog
                transactionId={transactionDetailsId}
                open={isTransactionDetailsOpen}
                onOpenChange={setIsTransactionDetailsOpen}
            />
        </div>
    );
}
