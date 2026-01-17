'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDateUTC } from '@/lib/date';
import { getTransactionById } from '@/services/financas.service';
import { Transaction } from '@/types/financas.types';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, FileText, Loader, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TransactionDetailsDialogProps {
    transactionId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({
    transactionId,
    open,
    onOpenChange,
}: TransactionDetailsDialogProps) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && transactionId) {
            loadTransaction();
        }
    }, [open, transactionId]);

    const loadTransaction = async () => {
        if (!transactionId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getTransactionById(transactionId);
            setTransaction(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao carregar transação');
            setTransaction(null);
        } finally {
            setLoading(false);
        }
    };

    const isIncome = transaction && transaction.value > 0;
    const absValue = transaction ? Math.abs(transaction.value) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Detalhes da Transação
                    </DialogTitle>
                    <DialogDescription>
                        Informações completas sobre esta movimentação financeira
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && transaction && (
                    <div className="space-y-6">
                        {/* Valor Principal */}
                        <div className={`p-6 rounded-lg border-2 ${
                            isIncome 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full ${
                                        isIncome 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {isIncome ? (
                                            <ArrowUpRight className="h-6 w-6" />
                                        ) : (
                                            <ArrowDownLeft className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {isIncome ? 'Entrada' : 'Saída'}
                                        </p>
                                        <p className={`text-3xl font-bold ${
                                            isIncome ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            {absValue.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={transaction.isClassified ? 'default' : 'secondary'}>
                                    {transaction.isClassified ? 'Classificada' : 'Não Classificada'}
                                </Badge>
                            </div>
                        </div>

                        {/* Informações Básicas */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Data</span>
                                </div>
                                <p className="font-medium">{formatDateUTC(transaction.date)}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    <span>Categoria</span>
                                </div>
                                {transaction.category ? (
                                    <div className="flex items-center gap-2">
                                        {transaction.category.color && (
                                            <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: transaction.category.color }}
                                            />
                                        )}
                                        <p className="font-medium">{transaction.category.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Sem categoria</p>
                                )}
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>Descrição</span>
                            </div>
                            <p className="font-medium bg-gray-50 p-3 rounded border">
                                {transaction.description || 'Sem descrição'}
                            </p>
                        </div>

                        {/* Notas */}
                        {transaction.notes && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span>Notas</span>
                                </div>
                                <p className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                                    {transaction.notes}
                                </p>
                            </div>
                        )}

                        {/* Sugestão AI */}
                        {transaction.aiSuggestion && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Sugestão AI</span>
                                </div>
                                <p className="bg-purple-50 border border-purple-200 p-3 rounded text-sm">
                                    {transaction.aiSuggestion}
                                </p>
                            </div>
                        )}

                        {/* ID Externo */}
                        {transaction.externalId && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">ID Externo</p>
                                <p className="font-mono text-xs bg-gray-100 p-2 rounded border">
                                    {transaction.externalId}
                                </p>
                            </div>
                        )}

                        {/* Metadados */}
                        {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Metadados</p>
                                <div className="bg-gray-50 border rounded p-3">
                                    <pre className="text-xs overflow-x-auto">
                                        {JSON.stringify(transaction.metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Informações do Sistema */}
                        <div className="pt-4 border-t space-y-2">
                            <p className="text-xs text-muted-foreground">
                                <strong>ID:</strong> {transaction.idTransaction}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong>Criada em:</strong> {formatDateUTC(transaction.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                <strong>Atualizada em:</strong> {formatDateUTC(transaction.updatedAt)}
                            </p>
                        </div>

                        {/* Botão Fechar */}
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
