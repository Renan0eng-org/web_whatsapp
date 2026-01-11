'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCategories, getTransactions, unclassifyTransaction } from '@/services/financas.service';
import { formatDateUTC } from '@/lib/date';
import { ExpenseCategory, Transaction } from '@/types/financas.types';
import { AlertCircle, ArrowLeft, Loader, RefreshCcw, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function MovementsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: 'all',
    type: 'all' as 'all' | 'income' | 'expense',
    startDate: '',
    endDate: '',
    minValue: '',
    maxValue: '',
  });
  const [reloading, setReloading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, txs] = await Promise.all([
        getCategories(),
        getTransactions({ isClassified: true }),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar movimentações' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const applyFilters = async () => {
    try {
      setReloading(true);
      const params: any = {
        isClassified: true,
      };
      if (filters.search) params.search = filters.search;
      if (filters.categoryId && filters.categoryId !== 'all') params.categoryId = filters.categoryId;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minValue) params.minValue = Number(filters.minValue);
      if (filters.maxValue) params.maxValue = Number(filters.maxValue);

      const txs = await getTransactions(params);
      setTransactions(txs);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao aplicar filtros' });
    } finally {
      setReloading(false);
    }
  };

  const handleUnclassify = async (id: string) => {
    try {
      setReloading(true);
      await unclassifyTransaction(id);
      setMessage({ type: 'success', text: 'Movimentação desclassificada' });
      await applyFilters();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Erro ao desclassificar' });
    } finally {
      setReloading(false);
    }
  };

  const total = useMemo(
    () => transactions.reduce((sum, t) => sum + t.value, 0),
    [transactions]
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Movimentações Classificadas</h1>
          <p className="text-muted-foreground mt-2">Visualize e desclassifique movimentações para reprocessar.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/financas">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Link>
          </Button>
          <Button variant="outline" onClick={applyFilters} disabled={reloading}>
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
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Descrição, notas, identificador"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(v) => setFilters({ ...filters, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.idCategory} value={cat.idCategory}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(v: 'all' | 'income' | 'expense') => setFilters({ ...filters, type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor mínimo</Label>
              <Input
                type="number"
                step="0.01"
                value={filters.minValue}
                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor máximo</Label>
              <Input
                type="number"
                step="0.01"
                value={filters.maxValue}
                onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters} disabled={reloading}>
              Aplicar filtros
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ search: '', categoryId: 'all', type: 'all', startDate: '', endDate: '', minValue: '', maxValue: '' });
                applyFilters();
              }}
              disabled={reloading}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Movimentações ({transactions.length})</CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma movimentação encontrada.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.idTransaction}
                  className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{tx.description}</p>
                      {tx.category && <Badge variant="secondary">{tx.category.name}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateUTC(tx.date)} • ID: {tx.externalId || '—'}
                    </p>
                    {tx.notes && (
                      <p className="text-xs text-muted-foreground">Notas: {tx.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3 md:mt-0">
                    <p className={`text-sm font-semibold ${tx.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.value >= 0 ? '+' : ''}
                      {tx.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnclassify(tx.idTransaction)}
                      disabled={reloading}
                    >
                      <Undo2 className="h-4 w-4 mr-1" /> Desclassificar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
