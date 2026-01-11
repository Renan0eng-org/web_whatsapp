'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    createLoanBatch,
    deleteLoan,
    getLoans,
    getLoansSummary,
    markAsPaid,
    reversePayment,
    updateLoan
} from '@/services/emprestimos.service';
import { getCategories } from '@/services/financas.service';
import { Loan, LoanSummary } from '@/types/emprestimos.types';
import { ExpenseCategory } from '@/types/financas.types';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    DollarSign,
    Edit,
    Loader,
    Plus,
    Trash2,
    TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EmprestimosPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
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
    const [newLoan, setNewLoan] = useState({
        borrowerName: '',
        items: [
            { amount: '', categoryId: '', dueDate: '', description: '', notes: '' }
        ] as { amount: string; categoryId: string; dueDate: string; description: string; notes: string }[],
        transactionId: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [loansData, summaryData, catData] = await Promise.all([
                getLoans(),
                getLoansSummary(),
                getCategories(),
            ]);
            setLoans(loansData);
            setSummary(summaryData);
            setCategories(catData);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro ao carregar empréstimos',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewLoan({
            borrowerName: '',
            items: [{ amount: '', categoryId: '', dueDate: '', description: '', notes: '' }],
            transactionId: '',
        });
    };

    const handleCreateLoan = async () => {
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
            await createLoanBatch({
                borrowerName: newLoan.borrowerName,
                transactionId: newLoan.transactionId || undefined,
                items: newLoan.items.map(i => ({
                    amount: parseFloat(i.amount),
                    categoryId: i.categoryId,
                    dueDate: new Date(i.dueDate),
                    description: i.description || undefined,
                    notes: i.notes || undefined,
                })),
            });
            await loadData();
            setIsCreateDialogOpen(false);
            resetForm();
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
    };

    const handleEditLoan = (loan: Loan) => {
        setEditingLoanId(loan.idLoan);
        setNewLoan({
            borrowerName: loan.borrowerName,
            items: [{
                amount: loan.amount.toString(),
                categoryId: loan.categoryId || '',
                dueDate: new Date(loan.dueDate).toISOString().split('T')[0],
                description: loan.description || '',
                notes: loan.notes || '',
            }],
            transactionId: loan.transactionId || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEditLoan = async () => {
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
            // For editing, we will update only the first item fields (single loan)
            await updateLoan(editingLoanId, {
                borrowerName: newLoan.borrowerName,
                amount: parseFloat(newLoan.items[0].amount),
                categoryId: newLoan.items[0].categoryId,
                dueDate: new Date(newLoan.items[0].dueDate),
                description: newLoan.items[0].description || undefined,
                notes: newLoan.items[0].notes || undefined,
            });
            await loadData();
            setIsEditDialogOpen(false);
            setEditingLoanId(null);
            resetForm();
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
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            setCreating(true);
            await markAsPaid(id);
            await loadData();
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
    };

    const handleReversePayment = async (id: string) => {
        try {
            setCreating(true);
            await reversePayment(id);
            await loadData();
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
    };

    const handleDeleteClick = (loanId: string) => {
        setDeletingLoanId(loanId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingLoanId) return;

        try {
            setCreating(true);
            await deleteLoan(deletingLoanId);
            await loadData();
            setIsDeleteDialogOpen(false);
            setDeletingLoanId(null);
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
    };

    const filteredLoans = loans.filter((loan) => {
        if (filter === 'pending') return !loan.isPaid;
        if (filter === 'paid') return loan.isPaid;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
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
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overdue Loans */}
                    {summary && summary.overdueLoans && summary.overdueLoans.length > 0 && (
                        <Card className="border-red-400 bg-red-100">
                            <CardHeader>
                                <CardTitle className="text-red-800">⚠️ Empréstimos Vencidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {summary.overdueLoans.map((loan: Loan) => (
                                        <div key={loan.idLoan} className="flex items-center justify-between pb-2 border-b border-red-300 last:border-0">
                                            <div>
                                                <p className="font-medium text-red-900">{loan.borrowerName}</p>
                                                <p className="text-sm text-red-700">
                                                    Vencido em {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
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
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Upcoming Payments */}
                    {summary.upcomingPayments.length > 0 && (
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
                                                    {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
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
            <div className="grid gap-4">
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
                                            {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={loan.isPaid ? 'secondary' : 'default'}>
                                            {loan.isPaid ? 'Pago' : 'Pendente'}
                                        </Badge>
                                        <Badge variant="outline">{loan.category?.name || 'Sem categoria'}</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Valor:</span>
                                    <span className="text-2xl font-bold">
                                        {loan.amount.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                        })}
                                    </span>
                                </div>
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
                                        Pago em {new Date(loan.paidDate).toLocaleDateString('pt-BR')}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Empréstimo</DialogTitle>
                        <DialogDescription>
                            Registre um novo empréstimo de dinheiro.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome de quem pediu emprestado *</label>
                            <Input
                                value={newLoan.borrowerName}
                                onChange={(e) => setNewLoan({ ...newLoan, borrowerName: e.target.value })}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Parcelas</label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNewLoan({
                                        ...newLoan,
                                        items: [...newLoan.items, { amount: '', categoryId: '', dueDate: '', description: '', notes: '' }]
                                    })}
                                >Adicionar parcela</Button>
                            </div>

                            {newLoan.items.map((item, idx) => (
                                <div key={idx} className="grid md:grid-cols-2 gap-3 p-3 border rounded">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Valor *</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const items = [...newLoan.items];
                                                items[idx].amount = e.target.value;
                                                setNewLoan({ ...newLoan, items });
                                            }}
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Categoria *</label>
                                        <Select value={item.categoryId} onValueChange={(val) => {
                                            const items = [...newLoan.items];
                                            items[idx].categoryId = val;
                                            setNewLoan({ ...newLoan, items });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.idCategory} value={cat.idCategory}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{cat.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Data de Vencimento *</label>
                                        <Input
                                            type="date"
                                            value={item.dueDate}
                                            onChange={(e) => {
                                                const items = [...newLoan.items];
                                                items[idx].dueDate = e.target.value;
                                                setNewLoan({ ...newLoan, items });
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Descrição (opcional)</label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => {
                                                const items = [...newLoan.items];
                                                items[idx].description = e.target.value;
                                                setNewLoan({ ...newLoan, items });
                                            }}
                                            placeholder="Motivo do empréstimo..."
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">Notas (opcional)</label>
                                        <Textarea
                                            value={item.notes}
                                            onChange={(e) => {
                                                const items = [...newLoan.items];
                                                items[idx].notes = e.target.value;
                                                setNewLoan({ ...newLoan, items });
                                            }}
                                            placeholder="Notas adicionais..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex justify-end md:col-span-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setNewLoan({
                                                ...newLoan,
                                                items: newLoan.items.filter((_, i) => i !== idx)
                                            })}
                                        >Remover</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Empréstimo</DialogTitle>
                        <DialogDescription>
                            Atualize os detalhes do empréstimo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome de quem pediu emprestado *</label>
                            <Input
                                value={newLoan.borrowerName}
                                onChange={(e) => setNewLoan({ ...newLoan, borrowerName: e.target.value })}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Valor *</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={newLoan.items[0].amount}
                                onChange={(e) => {
                                    const items = [...newLoan.items];
                                    items[0].amount = e.target.value;
                                    setNewLoan({ ...newLoan, items });
                                }}
                                placeholder="0,00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria *</label>
                            <Select value={newLoan.items[0].categoryId} onValueChange={(val) => {
                                const items = [...newLoan.items];
                                items[0].categoryId = val;
                                setNewLoan({ ...newLoan, items });
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.idCategory} value={cat.idCategory}>
                                            <div className="flex items-center gap-2">
                                                <span>{cat.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data de Vencimento *</label>
                            <Input
                                type="date"
                                value={newLoan.items[0].dueDate}
                                onChange={(e) => {
                                    const items = [...newLoan.items];
                                    items[0].dueDate = e.target.value;
                                    setNewLoan({ ...newLoan, items });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descrição (opcional)</label>
                            <Textarea
                                value={newLoan.items[0].description}
                                onChange={(e) => {
                                    const items = [...newLoan.items];
                                    items[0].description = e.target.value;
                                    setNewLoan({ ...newLoan, items });
                                }}
                                placeholder="Motivo do empréstimo..."
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notas (opcional)</label>
                            <Textarea
                                value={newLoan.items[0].notes}
                                onChange={(e) => {
                                    const items = [...newLoan.items];
                                    items[0].notes = e.target.value;
                                    setNewLoan({ ...newLoan, items });
                                }}
                                placeholder="Notas adicionais..."
                                rows={2}
                            />
                        </div>
                    </div>
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
        </div>
    );
}
