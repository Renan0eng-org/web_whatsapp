'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RecurringExpense } from '@/types/recurring-expense.types';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Category {
    idCategory: string;
    name: string;
}

interface ExpenseFormData {
    name: string;
    description: string;
    companyName: string;
    categoryId: string;
    qrCode: string;
    amount: string;
    dueDate: string;
    registrationDate: string;
    isRecurring?: boolean;
    recurringEndDate?: string;
}

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense?: RecurringExpense | null;
    categories: Category[];
    onSubmit: (data: ExpenseFormData) => Promise<void>;
    isSubmitting: boolean;
}

export function ExpenseFormDialog({
    open,
    onOpenChange,
    expense,
    categories,
    onSubmit,
    isSubmitting,
}: ExpenseFormDialogProps) {
    const [formData, setFormData] = useState<ExpenseFormData>({
        name: '',
        description: '',
        companyName: '',
        categoryId: '',
        qrCode: '',
        amount: '',
        dueDate: '',
        registrationDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurringEndDate: '',
    });

    useEffect(() => {
        if (expense) {
            // Modo edição - normaliza possíveis Date para string
            const due = expense.dueDate instanceof Date ? expense.dueDate : new Date(expense.dueDate as any);
            const reg = expense.registrationDate instanceof Date ? expense.registrationDate : new Date(expense.registrationDate as any);

            setFormData({
                name: expense.name,
                description: expense.description || '',
                companyName: expense.companyName || '',
                categoryId: expense.categoryId || '',
                qrCode: expense.qrCode || '',
                amount: expense.amount.toString(),
                dueDate: due.toISOString().split('T')[0],
                registrationDate: reg.toISOString().split('T')[0],
                isRecurring: !!expense.recurringGroupId, // Marcado se faz parte de um grupo
                recurringEndDate: '',
            });
        } else {
            // Modo criação - reset
            setFormData({
                name: '',
                description: '',
                companyName: '',
                categoryId: '',
                qrCode: '',
                amount: '',
                dueDate: '',
                registrationDate: new Date().toISOString().split('T')[0],
                isRecurring: false,
                recurringEndDate: '',
            });
        }
    }, [expense, open]);

    const handleSubmit = async () => {
        await onSubmit(formData);
    };

    const isEditing = !!expense;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Gasto Previsto' : 'Novo Gasto Previsto'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Atualize as informações do gasto'
                            : 'Adicione um novo gasto recorrente ou fixo'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Conta de Luz"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Nome da Empresa</Label>
                            <Input
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                placeholder="Ex: Copel"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes adicionais..."
                            rows={2}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.idCategory} value={cat.idCategory}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data de Vencimento *</Label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Cadastro *</Label>
                            <Input
                                type="date"
                                value={formData.registrationDate}
                                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 border-t pt-4">
                        <Checkbox
                            id="isRecurring"
                            checked={formData.isRecurring}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isRecurring: checked as boolean })
                            }
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="isRecurring"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Gasto Recorrente
                            </label>
                            <p className="text-sm text-muted-foreground">
                                {isEditing ? (
                                    expense?.recurringGroupId ? 
                                        'Desmarque para quebrar a série recorrente e manter apenas este gasto' :
                                        'Marque para criar gastos futuros baseado neste'
                                ) : (
                                    'Criar automaticamente para os próximos meses'
                                )}
                            </p>
                        </div>
                    </div>

                    {formData.isRecurring && (
                        <div className="space-y-2 pl-6">
                            <Label>Data Final da Recorrência (Opcional)</Label>
                            <Input
                                type="date"
                                value={formData.recurringEndDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, recurringEndDate: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                💡 Deixe em branco para recorrência infinita. O sistema criará gastos mensais
                                automaticamente baseado na data de vencimento.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>QR Code / Código de Barras</Label>
                        <Textarea
                            value={formData.qrCode}
                            onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                            placeholder="Cole aqui o código PIX ou código de barras..."
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            💡 Cole o código do PIX ou digitalize um código de barras
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? 'Atualizar' : 'Criar'} Gasto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
