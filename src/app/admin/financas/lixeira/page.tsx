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
import { Input } from '@/components/ui/input';
import { formatDateUTC } from '@/lib/date';
import { getDeletedTransactions, permanentDeleteTransaction, restoreTransaction } from '@/services/financas.service';
import { Transaction } from '@/types/financas.types';
import { AlertCircle, ArrowLeft, Loader, RefreshCcw, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

export default function LixeiraPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [search, setSearch] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const txs = await getDeletedTransactions();
            setTransactions(txs);
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao carregar transações deletadas' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRestore = async (id: string) => {
        startTransition(async () => {
            try {
                await restoreTransaction(id);
                setMessage({ type: 'success', text: 'Transação restaurada com sucesso!' });
                await loadData();
            } catch (err: any) {
                setMessage({ type: 'error', text: err?.response?.data?.message || 'Erro ao restaurar transação' });
            }
        });
    };

    const handlePermanentDelete = async () => {
        if (!transactionToDelete) return;

        startTransition(async () => {
            try {
                await permanentDeleteTransaction(transactionToDelete);
                setMessage({ type: 'success', text: 'Transação excluída permanentemente!' });
                setDeleteDialogOpen(false);
                setTransactionToDelete(null);
                await loadData();
            } catch (err: any) {
                setMessage({ type: 'error', text: err?.response?.data?.message || 'Erro ao excluir transação' });
            }
        });
    };

    const openDeleteDialog = (id: string) => {
        setTransactionToDelete(id);
        setDeleteDialogOpen(true);
    };

    const filteredTransactions = useMemo(() => {
        if (!search.trim()) return transactions;
        const term = search.toLowerCase();
        return transactions.filter(
            (t) =>
                t.description.toLowerCase().includes(term) ||
                t.notes?.toLowerCase().includes(term) ||
                t.externalId?.toLowerCase().includes(term)
        );
    }, [transactions, search]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-2 space-y-2 sm:space-y-6 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">🗑️ Lixeira</h1>
                    <p className="text-muted-foreground mt-2">
                        Transações deletadas. Você pode restaurá-las ou excluí-las permanentemente.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/admin/financas">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={loadData} disabled={isPending}>
                        <RefreshCcw className="h-4 w-4 mr-2" /> Atualizar
                    </Button>
                </div>
            </div>

            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Transações na Lixeira</CardTitle>
                    <CardDescription>
                        {transactions.length} transação(ões) na lixeira
                    </CardDescription>
                </CardHeader>
                <CardContent className='p-2 sm:p-4'>
                    <div className="mb-4">
                        <Input
                            placeholder="Buscar por descrição, notas ou identificador..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="text-center p-2 sm:py-8 text-muted-foreground">
                            {search ? 'Nenhuma transação encontrada com esse termo.' : 'Nenhuma transação na lixeira.'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction.idTransaction}
                                    className="flex items-center justify-between p-2 sm:p-4 border rounded-lg bg-muted/30 flex-wrap"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{transaction.description}</p>
                                            {transaction.category && (
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        backgroundColor: transaction.category.color + '20',
                                                        borderColor: transaction.category.color,
                                                        color: transaction.category.color,
                                                    }}
                                                >
                                                    {transaction.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Data: {formatDateUTC(transaction.date)}</span>
                                            {transaction.deletedAt && (
                                                <span>Deletado em: {formatDateUTC(transaction.deletedAt)}</span>
                                            )}
                                            {transaction.externalId && (
                                                <span className="text-xs">ID: {transaction.externalId}</span>
                                            )}
                                        </div>
                                        {transaction.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 justify-between w-full">
                                        <span
                                            className={`font-semibold ${transaction.value >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}
                                        >
                                            {transaction.value.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore(transaction.idTransaction)}
                                                disabled={isPending}
                                                title="Restaurar"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                Restaurar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => openDeleteDialog(transaction.idTransaction)}
                                                disabled={isPending}
                                                title="Excluir Permanentemente"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A transação será excluída permanentemente
                            do sistema e não poderá ser recuperada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePermanentDelete}
                            disabled={isPending}
                            className='p-0 m-0 bg-transparent'
                        >
                            <Button
                                variant="destructive"
                                disabled={isPending}
                            >
                            {isPending ? (
                                <Loader className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Excluir Permanentemente
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
