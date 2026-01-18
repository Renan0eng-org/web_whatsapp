'use client';

import { ExpenseFormDialog } from '@/components/ExpenseFormDialog';
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
import { getCategories } from '@/services/financas.service';
import {
    createRecurringExpense,
    deleteRecurringExpense,
    deleteRecurringExpenseGroup,
    getOverdueExpenses,
    getRecurringExpenseGroup,
    getRecurringExpenses,
    getUpcomingExpenses,
    markExpenseAsPaid,
    testNotification,
    updateRecurringExpense
} from '@/services/recurring-expense.service';
import { ExpenseCategory } from '@/types/financas.types';
import { RecurringExpense } from '@/types/recurring-expense.types';
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    Clock,
    Edit,
    Loader,
    Plus,
    QrCode,
    Trash2,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GastosPage() {
    const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [upcomingExpenses, setUpcomingExpenses] = useState<RecurringExpense[]>([]);
    const [overdueExpenses, setOverdueExpenses] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'paid'>('active');
    const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null);
    const [expenseGroup, setExpenseGroup] = useState<RecurringExpense[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [testingNotification, setTestingNotification] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [expensesData, categoriesData, upcomingData, overdueData] = await Promise.all([
                getRecurringExpenses(),
                getCategories(),
                getUpcomingExpenses(7),
                getOverdueExpenses(),
            ]);

            setExpenses(expensesData);
            setCategories(categoriesData);
            setUpcomingExpenses(upcomingData);
            setOverdueExpenses(overdueData);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao carregar dados',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (formData: any) => {
        try {
            setSubmitting(true);

            const data = {
                name: formData.name,
                description: formData.description || undefined,
                companyName: formData.companyName || undefined,
                categoryId: formData.categoryId || undefined,
                qrCode: formData.qrCode || undefined,
                dueDate: new Date(formData.dueDate),
                amount: parseFloat(formData.amount),
                registrationDate: new Date(formData.registrationDate),
                isRecurring: formData.isRecurring || false,
                recurringEndDate: formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined,
            };

            if (editingExpense) {
                // Atualizar
                await updateRecurringExpense(editingExpense.idRecurringExpense, data);
                setMessage({
                    type: 'success',
                    text: 'Gasto atualizado com sucesso',
                });
            } else {
                // Criar
                await createRecurringExpense(data);
                setMessage({
                    type: 'success',
                    text: formData.isRecurring 
                        ? 'Gastos recorrentes criados com sucesso'
                        : 'Gasto criado com sucesso',
                });
            }

            setIsFormDialogOpen(false);
            setEditingExpense(null);
            loadData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || `Erro ao ${editingExpense ? 'atualizar' : 'criar'} gasto`,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            await markExpenseAsPaid(id);
            setMessage({
                type: 'success',
                text: 'Gasto marcado como pago',
            });
            loadData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao marcar como pago',
            });
        }
    };

    const handleEdit = (expense: RecurringExpense) => {
        setEditingExpense(expense);
        setIsFormDialogOpen(true);
    };

    const handleDelete = async (deleteAll: boolean = false) => {
        if (!deletingExpenseId) return;

        try {
            if (deleteAll) {
                await deleteRecurringExpenseGroup(deletingExpenseId);
                setMessage({
                    type: 'success',
                    text: `Todos os gastos da série foram deletados (${expenseGroup.length} itens)`,
                });
            } else {
                await deleteRecurringExpense(deletingExpenseId);
                setMessage({
                    type: 'success',
                    text: 'Gasto deletado com sucesso',
                });
            }
            
            setIsDeleteDialogOpen(false);
            setDeletingExpenseId(null);
            setDeletingExpense(null);
            setExpenseGroup([]);
            loadData();
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao deletar gasto',
            });
        }
    };

    const prepareDelete = async (expense: RecurringExpense) => {
        setDeletingExpenseId(expense.idRecurringExpense);
        setDeletingExpense(expense);
        
        // Buscar grupo se existir
        if (expense.recurringGroupId) {
            try {
                const group = await getRecurringExpenseGroup(expense.idRecurringExpense);
                setExpenseGroup(group);
            } catch (error) {
                setExpenseGroup([]);
            }
        } else {
            setExpenseGroup([]);
        }
        
        setIsDeleteDialogOpen(true);
    };

    const handleTestNotification = async () => {
        try {
            setTestingNotification(true);
            await testNotification();
            setMessage({
                type: 'success',
                text: 'Notificação de teste enviada!',
            });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao enviar notificação',
            });
        } finally {
            setTestingNotification(false);
        }
    };

    const filteredExpenses = expenses.filter((expense) => {
        if (filter === 'active') return expense.isActive && !expense.isPaid;
        if (filter === 'paid') return expense.isPaid;
        return true;
    });

    const totalOverdue = overdueExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalUpcoming = upcomingExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gastos Previstos</h1>
                    <p className="text-muted-foreground">Gerencie suas despesas recorrentes e fixas</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleTestNotification}
                        disabled={testingNotification}
                    >
                        {testingNotification ? (
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Bell className="h-4 w-4 mr-2" />
                        )}
                        Testar Notificação
                    </Button>
                    <Button onClick={() => {
                        setEditingExpense(null);
                        setIsFormDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Gasto
                    </Button>
                </div>
            </div>

            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            {/* Cards de Resumo */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Atrasados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {overdueExpenses.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total: {totalOverdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            Próximos 7 Dias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {upcomingExpenses.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total: {totalUpcoming.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Total Ativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {expenses.filter(e => e.isActive && !e.isPaid).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total: {expenses.filter(e => e.isActive && !e.isPaid).reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    Todos ({expenses.length})
                </Button>
                <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                >
                    Ativos ({expenses.filter(e => e.isActive && !e.isPaid).length})
                </Button>
                <Button
                    variant={filter === 'paid' ? 'default' : 'outline'}
                    onClick={() => setFilter('paid')}
                >
                    Pagos ({expenses.filter(e => e.isPaid).length})
                </Button>
            </div>

            {/* Lista de Gastos */}
            <div className="grid gap-4">
                {filteredExpenses.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">Nenhum gasto encontrado</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredExpenses.map((expense) => {
                        const dueDate = new Date(expense.dueDate);
                        const isOverdue = !expense.isPaid && dueDate < new Date();
                        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <Card key={expense.idRecurringExpense}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {expense.name}
                                                {expense.recurringGroupId && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Série
                                                    </Badge>
                                                )}
                                                {expense.isPaid && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Pago
                                                    </Badge>
                                                )}
                                                {isOverdue && (
                                                    <Badge variant="destructive">
                                                        Atrasado
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4 mt-1">
                                                {expense.companyName && <span>{expense.companyName}</span>}
                                                <span>Venc: {new Date(expense.dueDate).toLocaleDateString('pt-BR')}</span>
                                                {!expense.isPaid && !isOverdue && daysUntilDue >= 0 && (
                                                    <span className="text-orange-600">Em {daysUntilDue} dia(s)</span>
                                                )}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(expense)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {!expense.isPaid && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 hover:text-green-700"
                                                    onClick={() => handleMarkAsPaid(expense.idRecurringExpense)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Pagar
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => prepareDelete(expense)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Valor</p>
                                            <p className="text-xl font-bold">
                                                {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>
                                        {expense.description && (
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-muted-foreground">Descrição</p>
                                                <p className="text-sm">{expense.description}</p>
                                            </div>
                                        )}
                                        {expense.qrCode && (
                                            <div className="md:col-span-3">
                                                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                                    <QrCode className="h-4 w-4" />
                                                    QR Code / Código de Barras
                                                </p>
                                                <code className="bg-gray-100 p-2 rounded text-xs block break-all">
                                                    {expense.qrCode}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Form Dialog */}
            <ExpenseFormDialog
                open={isFormDialogOpen}
                onOpenChange={(open) => {
                    setIsFormDialogOpen(open);
                    if (!open) setEditingExpense(null);
                }}
                expense={editingExpense}
                categories={categories}
                onSubmit={handleFormSubmit}
                isSubmitting={submitting}
            />

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            {expenseGroup.length > 1 ? (
                                <>
                                    <p className="mb-3">
                                        Este gasto faz parte de uma série recorrente com <strong>{expenseGroup.length} gastos</strong>.
                                    </p>
                                    <p>Escolha uma opção:</p>
                                </>
                            ) : (
                                'Tem certeza que deseja excluir este gasto? Esta ação não pode ser desfeita.'
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {expenseGroup.length > 1 ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleDelete(false)}
                                >
                                    Excluir Apenas Este
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(true)}
                                >
                                    Excluir Todos ({expenseGroup.length})
                                </Button>
                            </>
                        ) : (
                            <AlertDialogAction onClick={() => handleDelete(false)}>
                                Excluir
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
