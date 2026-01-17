'use client';

import { LoanForm } from '@/components/LoanForm';
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
import ColorPicker from '@/components/ui/color-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import IconPicker from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateUTC } from '@/lib/date';
import { getLoans } from '@/services/emprestimos.service';
import {
    classifyTransaction,
    createCategory,
    deleteTransaction,
    getCategories,
    getPaidLoans,
    getTransactions
} from '@/services/financas.service';
import { ExpenseCategory, Transaction } from '@/types/financas.types';
import {
    AlertCircle,
    Banknote,
    BarChart3,
    Book,
    Briefcase,
    Car,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Coins,
    CreditCard,
    DollarSign,
    Droplet,
    FileText,
    Fuel,
    Gamepad2,
    Gift,
    Heart,
    Home,
    Loader,
    MessagesSquare,
    MoreHorizontal,
    Package,
    Phone,
    PieChart,
    PiggyBank,
    Pill,
    Plane,
    Receipt,
    Shield,
    ShoppingCart,
    Stethoscope,
    Ticket,
    Trash2,
    TrendingDown,
    TrendingUp,
    Utensils,
    Wallet,
    Wifi,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ICON_MAP = {
    Home,
    MessagesSquare,
    Shield,
    Wallet,
    ShoppingCart,
    CreditCard,
    Car,
    Utensils,
    Heart,
    Book,
    Phone,
    FileText,
    TrendingUp,
    MoreHorizontal,
    PiggyBank,
    Banknote,
    DollarSign,
    Coins,
    Receipt,
    PieChart,
    BarChart3,
    TrendingDown,
    Coffee,
    Fuel,
    Zap,
    Droplet,
    Wifi,
    Package,
    Gift,
    Pill,
    Stethoscope,
    Briefcase,
    Plane,
    Ticket,
    Gamepad2
} as const;

function getIconComponent(name?: string) {
    if (!name) return null;
    return (ICON_MAP as Record<string, any>)[name] || null;
}

export default function ClassificarPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [paidLoans, setPaidLoans] = useState<any[]>([]);
    const [unpaidLoans, setUnpaidLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [classifying, setClassifying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [createLoan, setCreateLoan] = useState(false);
    const [linkToExistingLoan, setLinkToExistingLoan] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState('');
    const [linkLoanPayments, setLinkLoanPayments] = useState(false);
    const [loanPaymentAmounts, setLoanPaymentAmounts] = useState<{ [loanId: string]: string }>({});
    const [loanFormData, setLoanFormData] = useState({
        borrowerName: '',
        items: [{
            amount: '',
            categoryId: '',
            dueDate: '',
            description: '',
            notes: '',
            interestRate: '',
            interestType: 'SIMPLE',
            createdAt: '',
            periodRule: 'MENSAL',
            marketReference: '',
            expectedProfit: '',
            isRecurringInterest: false,
            recurringInterestDay: '1',
        }],
        transactionId: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [filter, setFilter] = useState<'all' | 'unclassified'>('unclassified');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: '' as
            | 'ALIMENTACAO'
            | 'TRANSPORTE'
            | 'UTILIDADES'
            | 'SAUDE'
            | 'EDUCACAO'
            | 'LAZER'
            | 'TELEFONE'
            | 'INTERNET'
            | 'SEGUROS'
            | 'IMPOSTOS'
            | 'RENDA'
            | 'INVESTIMENTOS'
            | 'OUTRAS',
        color: '#808080',
        description: '',
        icon: '',
    });

    const categoryTypes = [
        'ALIMENTACAO',
        'TRANSPORTE',
        'UTILIDADES',
        'SAUDE',
        'EDUCACAO',
        'LAZER',
        'TELEFONE',
        'INTERNET',
        'SEGUROS',
        'IMPOSTOS',
        'RENDA',
        'INVESTIMENTOS',
        'OUTRAS',
    ] as const;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transData, catData, unpaidLoansData] = await Promise.all([
                getTransactions({ isClassified: false }),
                getCategories(),
                getLoans(false),
            ]);
            setTransactions(transData);
            setCategories(catData);
            setUnpaidLoans(unpaidLoansData);
            setCurrentIndex(0);
            setSelectedCategory('');
            setNotes('');
            setLinkLoanPayments(false);
            setLoanPaymentAmounts({});
            setCreateLoan(false);
            setLinkToExistingLoan(false);
            setSelectedLoanId('');
            setLoanFormData({
                borrowerName: '',
                items: [{
                    amount: '',
                    categoryId: '',
                    dueDate: '',
                    description: '',
                    notes: '',
                    interestRate: '',
                    interestType: 'SIMPLE',
                    createdAt: '',
                    periodRule: 'MENSAL',
                    marketReference: '',
                    expectedProfit: '',
                    isRecurringInterest: false,
                    recurringInterestDay: '1',
                }],
                transactionId: '',
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro ao carregar dados',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateProfit = (idx: number) => {
        const item = loanFormData.items[idx];
        if (!item.amount || !item.interestRate || !item.dueDate) return;

        const principal = parseFloat(item.amount);
        const rate = parseFloat(item.interestRate) / 100;
        const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
        const dueDate = new Date(item.dueDate);
        const periodRule = item.periodRule || 'MENSAL';
        const interestType = item.interestType || 'SIMPLE';

        // Se for juros recorrente, não calcula lucro previsto
        if (item.isRecurringInterest) {
            const items = [...loanFormData.items];
            items[idx].expectedProfit = '0';
            setLoanFormData({ ...loanFormData, items });
            return;
        }

        // Calcular meses até vencimento
        const diffTime = Math.abs(dueDate.getTime() - createdAt.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

        let profit = 0;
        if (interestType === 'SIMPLE') {
            const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;
            profit = principal * monthlyRate * diffMonths;
        } else {
            const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;
            profit = principal * (Math.pow(1 + monthlyRate, diffMonths) - 1);
        }

        const items = [...loanFormData.items];
        items[idx].expectedProfit = profit.toFixed(2);
        setLoanFormData({ ...loanFormData, items });
    };

    const currentTransaction = transactions[currentIndex];
    const isOutflow = currentTransaction && currentTransaction.value < 0;
    const loanItemsTotal = loanFormData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const transactionAbsValue = currentTransaction ? Math.abs(currentTransaction.value) : 0;
    const loansMatch = Math.abs(loanItemsTotal - transactionAbsValue) < 0.01;

    const handleClassify = async () => {
        if (!selectedCategory || !currentTransaction) {
            setMessage({
                type: 'error',
                text: 'Selecione uma categoria',
            });
            return;
        }

        if (createLoan && loanFormData.items.some(i => i.amount && i.dueDate)) {
            const itemsTotal = loanFormData.items.filter(i => i.amount && i.dueDate).reduce((sum, i) => sum + parseFloat(i.amount), 0);
            if (Math.abs(itemsTotal - transactionAbsValue) >= 0.01) {
                setMessage({
                    type: 'error',
                    text: `Soma das parcelas (${itemsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) deve ser igual a ${transactionAbsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                });
                return;
            }
        }

        // Validar total de pagamentos de empréstimo
        const totalLoanPayments = Object.values(loanPaymentAmounts)
            .filter((v) => v)
            .reduce((sum, v) => sum + parseFloat(v as string), 0);
        
        if (createLoan && totalLoanPayments > currentTransaction.value) {
            setMessage({
                type: 'error',
                text: `Total alocado para empréstimos (${totalLoanPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) não pode ultrapassar o valor da movimentação (${currentTransaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`,
            });
            return;
        }

        try {
            setClassifying(true);
            
            // Preparar pagamentos de empréstimo
            const loanPayments = Object.entries(loanPaymentAmounts)
                .filter(([_, amount]) => amount && parseFloat(amount) > 0)
                .map(([loanId, amount]) => ({
                    loanId,
                    amount: parseFloat(amount),
                }));

            // Adicionar vinculação a empréstimo existente se selecionado
            if (linkToExistingLoan && selectedLoanId) {
                loanPayments.push({
                    loanId: selectedLoanId,
                    amount: transactionAbsValue,
                });
            }

            await classifyTransaction(
                currentTransaction.idTransaction,
                selectedCategory,
                notes || undefined,
                {
                    createLoan,
                    borrowerName: loanFormData.borrowerName || undefined,
                    loanItems: createLoan ? loanFormData.items
                        .filter(i => i.amount && i.dueDate && i.categoryId)
                        .map(i => ({
                            amount: parseFloat(i.amount),
                            categoryId: i.categoryId,
                            dueDate: new Date(i.dueDate),
                            description: i.description || undefined,
                            notes: i.notes || undefined,
                            interestRate: i.interestRate ? parseFloat(i.interestRate) : undefined,
                            interestType: i.interestType as any,
                            periodRule: i.periodRule as any,
                            expectedProfit: i.expectedProfit ? parseFloat(i.expectedProfit) : undefined,
                            isRecurringInterest: i.isRecurringInterest,
                            recurringInterestDay: i.recurringInterestDay ? parseInt(i.recurringInterestDay) : undefined,
                            createdAt: i.createdAt ? new Date(i.createdAt) : undefined,
                        })) : undefined,
                    loanPayments: loanPayments.length > 0 ? loanPayments : undefined,
                },
            );

            setMessage({
                type: 'success',
                text: 'Transação classificada com sucesso',
            });

            // Remove the classified transaction
            const newTransactions = transactions.filter((_, i) => i !== currentIndex);
            setTransactions(newTransactions);

            // Reset for next transaction
            if (newTransactions.length > 0) {
                setCurrentIndex(Math.min(currentIndex, newTransactions.length - 1));
                setSelectedCategory('');
                setNotes('');
                setCreateLoan(false);
                setLinkToExistingLoan(false);
                setSelectedLoanId('');
                setLoanPaymentAmounts({});
                setLoanFormData({
                    borrowerName: '',
                    items: [{
                        amount: '',
                        categoryId: '',
                        dueDate: '',
                        description: '',
                        notes: '',
                        interestRate: '',
                        interestType: 'SIMPLE',
                        createdAt: '',
                        periodRule: 'MENSAL',
                        marketReference: '',
                        expectedProfit: '',
                        isRecurringInterest: false,
                        recurringInterestDay: '1',
                    }],
                    transactionId: '',
                });
            }

            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erro ao classificar',
            });
        } finally {
            setClassifying(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < transactions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedCategory(transactions[currentIndex + 1].categoryId || '');
            setNotes(transactions[currentIndex + 1].notes || '');
            setMessage(null);
        }
    };

    const handleDeleteTransaction = async () => {
        if (!currentTransaction) return;
        try {
            setDeleting(true);
            await deleteTransaction(currentTransaction.idTransaction);

            setMessage({
                type: 'success',
                text: 'Transação deletada com sucesso',
            });

            // Remove the deleted transaction
            const newTransactions = transactions.filter((_, i) => i !== currentIndex);
            setTransactions(newTransactions);

            // Reset for next transaction
            if (newTransactions.length > 0) {
                setCurrentIndex(Math.min(currentIndex, newTransactions.length - 1));
                setSelectedCategory('');
                setNotes('');
                setCreateLoan(false);
                setLinkToExistingLoan(false);
                setSelectedLoanId('');
                setLoanFormData({
                    borrowerName: '',
                    items: [{
                        amount: '',
                        categoryId: '',
                        dueDate: '',
                        description: '',
                        notes: '',
                        interestRate: '',
                        interestType: 'SIMPLE',
                        createdAt: '',
                        periodRule: 'MENSAL',
                        marketReference: '',
                        expectedProfit: '',
                        isRecurringInterest: false,
                        recurringInterestDay: '1',
                    }],
                    transactionId: '',
                });
                setLinkLoanPayments(false);
                setLoanPaymentAmounts({});
            }

            setIsDeleteDialogOpen(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erro ao deletar transação',
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleLinkLoanPayments = async (checked: boolean) => {
        setLinkLoanPayments(checked);
        if (!checked) {
            // Limpar valores de pagamento quando desmarcar
            setLoanPaymentAmounts({});
        } else if (paidLoans.length === 0) {
            // Carregar empréstimos pagos quando marcar
            try {
                const loans = await getPaidLoans();
                setPaidLoans(loans);
            } catch (error) {
                setMessage({
                    type: 'error',
                    text: 'Erro ao carregar empréstimos pagos',
                });
            }
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name || !newCategory.type) {
            setMessage({ type: 'error', text: 'Informe nome e tipo da categoria' });
            return;
        }
        try {
            setCreating(true);
            const created = await createCategory({
                name: newCategory.name,
                type: newCategory.type,
                color: newCategory.color || undefined,
                description: newCategory.description || undefined,
                icon: newCategory.icon || undefined,
            });
            const catData = await getCategories();
            setCategories(catData);
            setSelectedCategory(created.idCategory);
            setIsDialogOpen(false);
            setNewCategory({ name: '', type: '' as any, color: '#808080', description: '', icon: '' });
            setMessage({ type: 'success', text: 'Categoria criada com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao criar categoria',
            });
        } finally {
            setCreating(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSelectedCategory(transactions[currentIndex - 1].categoryId || '');
            setNotes(transactions[currentIndex - 1].notes || '');
            setMessage(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classificar Despesas</h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                Parabéns! Todas as transações foram classificadas.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const progress = Math.round(
        (currentIndex / transactions.length) * 100,
    );

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Classificar Despesas</h1>
                <p className="text-muted-foreground mt-2">
                    {transactions.length} transação(ões) para classificar
                </p>
            </div>

            <div className="grid gap-6">
                {/* Progress */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progresso</span>
                                <span className="font-semibold">
                                    {currentIndex + 1} de {transactions.length}
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Transaction */}
                {currentTransaction && (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>
                                        {currentTransaction.value > 0 ? '+' : ''}
                                        {currentTransaction.value.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                        })}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {formatDateUTC(currentTransaction.date)}
                                    </CardDescription>
                                </div>
                                <Badge variant={currentTransaction.value > 0 ? 'default' : 'destructive'}>
                                    {currentTransaction.value > 0 ? 'Entrada' : 'Saída'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-3 bg-muted rounded">
                                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                                <p className="mt-1 font-semibold">{currentTransaction.description}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.idCategory} value={cat.idCategory}>
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const IconComp = getIconComponent(cat.icon);
                                                                return IconComp ? <IconComp className="h-4 w-4" /> : null;
                                                            })()}
                                                            {cat.color && (
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: cat.color }}
                                                                />
                                                            )}
                                                            <span>{cat.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                        Nova categoria
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notas (opcional)</label>
                                <Textarea
                                    placeholder="Adicione observações sobre esta transação..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            {isOutflow && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Criar como Empréstimo</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={createLoan}
                                                onChange={(e) => {
                                                    setCreateLoan(e.target.checked);
                                                    if (e.target.checked) {
                                                        setLinkToExistingLoan(false);
                                                    }
                                                }}
                                            />
                                            <span className="text-sm text-muted-foreground">Criar um novo empréstimo com este valor</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Vincular a Empréstimo Existente</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={linkToExistingLoan}
                                                onChange={(e) => {
                                                    setLinkToExistingLoan(e.target.checked);
                                                    if (e.target.checked) {
                                                        setCreateLoan(false);
                                                    }
                                                }}
                                            />
                                            <span className="text-sm text-muted-foreground">Esta saída é um pagamento de empréstimo</span>
                                        </div>
                                        
                                        {linkToExistingLoan && (
                                            <div className="space-y-2 mt-2">
                                                <label className="text-sm font-medium">Selecione o Empréstimo</label>
                                                <Select
                                                    value={selectedLoanId}
                                                    onValueChange={setSelectedLoanId}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um empréstimo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {unpaidLoans.map((loan) => (
                                                            <SelectItem key={loan.idLoan} value={loan.idLoan}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{loan.borrowerName || 'Sem nome'}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                                                        {' - Vencimento: '}{formatDateUTC(loan.dueDate)}
                                                                        {loan.remainingBalance > 0 && ` - Pendente: ${loan.remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    {createLoan && (
                                        <div className="space-y-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-blue-900">Total: {loanItemsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                <p className={`text-sm ${loansMatch ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {loansMatch ? '✓ Soma confere' : `⚠ Deve ser ${transactionAbsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                                                </p>
                                            </div>

                                            <LoanForm
                                                formData={loanFormData}
                                                categories={categories}
                                                onFormChange={setLoanFormData}
                                                onCalculateProfit={handleCalculateProfit}
                                                mode="create"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentTransaction && currentTransaction.value > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Linkar Pagamentos de Empréstimos</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={linkLoanPayments}
                                        onChange={(e) => handleToggleLinkLoanPayments(e.target.checked)}
                                    />
                                    <span className="text-sm text-muted-foreground">Vincular empréstimos pagos a esta entrada</span>
                                </div>
                                {linkLoanPayments && paidLoans.length > 0 && (
                                    <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                                        <p className="text-xs text-muted-foreground">Especifique quanto desta entrada vai para cada empréstimo</p>
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {paidLoans.map((loan) => {
                                                const totalPaid = loan.totalPaid || 0;
                                                const remainingBalance = loan.remainingBalance || loan.amount;
                                                const percentPaid = ((totalPaid / loan.amount) * 100).toFixed(0);
                                                
                                                return (
                                                <div key={loan.idLoan} className="p-3 bg-white rounded border space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-blue-900">{loan.borrowerName}</p>
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-xs text-gray-700">
                                                                    <span className="font-medium">Total do empréstimo:</span> {loan.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                </p>
                                                                {totalPaid > 0 && (
                                                                    <p className="text-xs text-green-600">
                                                                        <span className="font-medium">Já pago:</span> {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({percentPaid}%)
                                                                    </p>
                                                                )}
                                                                {remainingBalance > 0 && (
                                                                    <p className="text-xs text-orange-600">
                                                                        <span className="font-medium">Falta pagar:</span> {remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                    </p>
                                                                )}
                                                                {remainingBalance === 0 && (
                                                                    <p className="text-xs text-green-700 font-medium">
                                                                        ✓ Empréstimo totalmente pago
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {/* Barra de progresso */}
                                                            {totalPaid > 0 && (
                                                                <div className="mt-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${percentPaid}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="Quanto será pago para este empréstimo?"
                                                        value={loanPaymentAmounts[loan.idLoan] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setLoanPaymentAmounts({
                                                                ...loanPaymentAmounts,
                                                                [loan.idLoan]: value,
                                                            });
                                                        }}
                                                        step="0.01"
                                                        min="0"
                                                        max={remainingBalance}
                                                        className="w-full px-3 py-2 text-sm border rounded bg-white"
                                                    />
                                                </div>
                                                );
                                            })}
                                        </div>
                                        {Object.keys(loanPaymentAmounts).filter(k => loanPaymentAmounts[k]).length > 0 && (
                                            <div className={`p-3 rounded ${
                                                Object.values(loanPaymentAmounts)
                                                    .filter((v) => v)
                                                    .reduce((sum, v) => sum + parseFloat(v as string), 0) > currentTransaction.value
                                                    ? 'bg-red-100 border border-red-300'
                                                    : 'bg-blue-100 border border-blue-300'
                                            }`}>
                                                <div className="space-y-1">
                                                    <p className={`text-xs font-medium ${
                                                        Object.values(loanPaymentAmounts)
                                                            .filter((v) => v)
                                                            .reduce((sum, v) => sum + parseFloat(v as string), 0) > currentTransaction.value
                                                            ? 'text-red-800'
                                                            : 'text-blue-800'
                                                    }`}>
                                                        Total Alocado: {Object.values(loanPaymentAmounts)
                                                            .filter((v) => v)
                                                            .reduce((sum, v) => sum + parseFloat(v as string), 0)
                                                            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Disponível na Movimentação: {currentTransaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </p>
                                                    {Object.values(loanPaymentAmounts)
                                                        .filter((v) => v)
                                                        .reduce((sum, v) => sum + parseFloat(v as string), 0) > currentTransaction.value && (
                                                        <p className="text-xs text-red-700 font-medium">
                                                            ⚠️ Total alocado excede o valor da movimentação!
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}

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

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Anterior
                                </Button>

                                <Button
                                    onClick={handleClassify}
                                    disabled={!selectedCategory || classifying}
                                    className="flex-1"
                                >
                                    {classifying && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                                    Classificar
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleNext}
                                    disabled={currentIndex >= transactions.length - 1}
                                >
                                    Próxima
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={deleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar nova categoria</DialogTitle>
                        <DialogDescription>Adicione uma categoria para classificar despesas.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome</label>
                            <Input
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                placeholder="Ex: Supermercado"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <Select
                                value={newCategory.type}
                                onValueChange={(v) => setNewCategory({ ...newCategory, type: v as typeof newCategory.type })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryTypes.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cor</label>
                            <ColorPicker
                                value={newCategory.color}
                                onChange={(c) => setNewCategory({ ...newCategory, color: c })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição (opcional)</label>
                            <Textarea
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ícone (opcional)</label>
                            <IconPicker
                                value={newCategory.icon}
                                onChange={(name) => setNewCategory({ ...newCategory, icon: name })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateCategory} disabled={creating}>
                            {creating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar Transação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar esta transação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTransaction}
                            disabled={deleting}
                        >
                            {deleting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Deletar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
