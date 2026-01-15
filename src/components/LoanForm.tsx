import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseCategory } from '@/types/financas.types';

interface LoanFormItem {
    amount: string;
    categoryId: string;
    dueDate: string;
    description: string;
    notes: string;
    interestRate: string;
    interestType: string;
    createdAt: string;
    periodRule: string;
    marketReference: string;
    expectedProfit: string;
    isRecurringInterest: boolean;
    recurringInterestDay: string;
}

interface LoanFormData {
    borrowerName: string;
    items: LoanFormItem[];
    transactionId: string;
}

interface LoanFormProps {
    formData: LoanFormData;
    categories: ExpenseCategory[];
    onFormChange: (data: LoanFormData) => void;
    onCalculateProfit: (idx: number) => void;
    mode: 'create' | 'edit';
}

// Função para calcular o juros mensal
function calculateMonthlyInterest(amount: number, rate: number, periodRule: string): number {
    const monthlyRate = periodRule === 'ANUAL' ? rate / 12 : rate;
    return amount * (monthlyRate / 100);
}

export function LoanForm({ formData, categories, onFormChange, onCalculateProfit, mode }: LoanFormProps) {
    const updateItem = (idx: number, field: keyof LoanFormItem, value: string | boolean) => {
        const items = [...formData.items];
        (items[idx] as any)[field] = value;
        onFormChange({ ...formData, items });
    };

    const addItem = () => {
        onFormChange({
            ...formData,
            items: [
                ...formData.items,
                {
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
                },
            ],
        });
    };

    const removeItem = (idx: number) => {
        onFormChange({
            ...formData,
            items: formData.items.filter((_, i) => i !== idx),
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Nome de quem pediu emprestado *</label>
                <Input
                    value={formData.borrowerName}
                    onChange={(e) => onFormChange({ ...formData, borrowerName: e.target.value })}
                    placeholder="Ex: João Silva"
                />
            </div>

            <div className="space-y-4">
                {mode === 'create' && (
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Parcelas</label>
                        <Button variant="outline" size="sm" onClick={addItem}>
                            Adicionar parcela
                        </Button>
                    </div>
                )}

                {formData.items.map((item, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-3 border rounded p-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Valor *</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                                placeholder="0,00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria *</label>
                            <Select
                                value={item.categoryId}
                                onValueChange={(val) => updateItem(idx, 'categoryId', val)}
                            >
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
                                    updateItem(idx, 'dueDate', e.target.value);
                                    setTimeout(() => onCalculateProfit(idx), 100);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Data de Criação (opcional)</label>
                            <Input
                                type="date"
                                value={item.createdAt}
                                onChange={(e) => {
                                    updateItem(idx, 'createdAt', e.target.value);
                                    setTimeout(() => onCalculateProfit(idx), 100);
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Taxa de Juros (%) (opcional)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={item.interestRate}
                                onChange={(e) => updateItem(idx, 'interestRate', e.target.value)}
                                onBlur={() => onCalculateProfit(idx)}
                                placeholder="Ex: 2.5"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Período</label>
                            <Select
                                value={item.periodRule}
                                onValueChange={(val) => {
                                    updateItem(idx, 'periodRule', val);
                                    setTimeout(() => onCalculateProfit(idx), 100);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MENSAL">Ao Mês</SelectItem>
                                    <SelectItem value="ANUAL">Ao Ano</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Modalidade de Juros</label>
                            <Select
                                value={item.interestType}
                                onValueChange={(val) => {
                                    updateItem(idx, 'interestType', val);
                                    setTimeout(() => onCalculateProfit(idx), 100);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SIMPLE">Juros Simples</SelectItem>
                                    <SelectItem value="COMPOUND">Juros Compostos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lucro Previsto (R$)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={item.expectedProfit}
                                onChange={(e) => updateItem(idx, 'expectedProfit', e.target.value)}
                                placeholder="Calculado automaticamente"
                            />
                        </div>

                        {/* Juros Recorrentes */}
                        {item.interestRate && parseFloat(item.interestRate) > 0 && (
                            <div className="space-y-3 md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`recurring-${idx}`}
                                        checked={item.isRecurringInterest}
                                        onCheckedChange={(checked) => {
                                            updateItem(idx, 'isRecurringInterest', !!checked)
                                            updateItem(idx, 'expectedProfit', "0")
                                        }}
                                    />
                                    <label 
                                        htmlFor={`recurring-${idx}`}
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Juros Recorrentes (pago todo mês)
                                    </label>
                                </div>
                                
                                {item.isRecurringInterest && (
                                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Dia de Cobrança</label>
                                            <Select
                                                value={item.recurringInterestDay || '1'}
                                                onValueChange={(val) => updateItem(idx, 'recurringInterestDay', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Dia do mês" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                                        <SelectItem key={day} value={day.toString()}>
                                                            Dia {day}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Valor Mensal Estimado</label>
                                            <div className="bg-white border rounded-md px-3 py-2">
                                                <span className="text-lg font-semibold text-amber-700">
                                                    {item.amount && item.interestRate
                                                        ? calculateMonthlyInterest(
                                                            parseFloat(item.amount),
                                                            parseFloat(item.interestRate),
                                                            item.periodRule
                                                        ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                        : 'R$ 0,00'
                                                    }
                                                </span>
                                                <span className="text-xs text-gray-500 ml-2">/ mês</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {item.isRecurringInterest && (
                                    <p className="text-xs text-amber-700">
                                        💡 Os juros serão cobrados mensalmente. O principal será devolvido na data de vencimento.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Descrição (opcional)</label>
                            <Input
                                value={item.description}
                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                placeholder="Motivo do empréstimo..."
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Notas (opcional)</label>
                            <Textarea
                                value={item.notes}
                                onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                                placeholder="Notas adicionais..."
                                rows={2}
                            />
                        </div>

                        {mode === 'create' && formData.items.length > 1 && (
                            <div className="flex justify-end md:col-span-2">
                                <Button variant="destructive" size="sm" onClick={() => removeItem(idx)}>
                                    Remover
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
