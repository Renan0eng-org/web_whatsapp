'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from '@/services/financas.service';
import { ExpenseCategory } from '@/types/financas.types';
import {
    AlertCircle,
    CheckCircle2,
    Edit,
    Loader,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Import all icons for categories
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
import {
    Banknote,
    BarChart3,
    Book,
    Briefcase,
    Car,
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
    TrendingDown,
    TrendingUp,
    Utensils,
    Wallet,
    Wifi,
    Zap
} from 'lucide-react';

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
    Gamepad2,
} as const;

function getIconComponent(name?: string) {
    if (!name) return null;
    return (ICON_MAP as Record<string, any>)[name] || null;
}

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

export default function CategoriasPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro ao carregar categorias',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewCategory({
            name: '',
            type: '' as any,
            color: '#808080',
            description: '',
            icon: '',
        });
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name || !newCategory.type) {
            setMessage({ type: 'error', text: 'Informe nome e tipo da categoria' });
            return;
        }
        try {
            setCreating(true);
            await createCategory({
                name: newCategory.name,
                type: newCategory.type,
                color: newCategory.color || undefined,
                description: newCategory.description || undefined,
                icon: newCategory.icon || undefined,
            });
            await loadCategories();
            setIsCreateDialogOpen(false);
            resetForm();
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

    const handleEditCategory = (cat: ExpenseCategory) => {
        setEditingCategoryId(cat.idCategory);
        setNewCategory({
            name: cat.name,
            type: (cat.type as any) || '',
            color: cat.color || '#808080',
            description: cat.description || '',
            icon: cat.icon || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEditCategory = async () => {
        if (!newCategory.name || !newCategory.type || !editingCategoryId) {
            setMessage({ type: 'error', text: 'Informe nome e tipo da categoria' });
            return;
        }
        try {
            setCreating(true);
            await updateCategory(editingCategoryId, {
                name: newCategory.name,
                type: newCategory.type,
                color: newCategory.color || undefined,
                description: newCategory.description || undefined,
                icon: newCategory.icon || undefined,
            });
            await loadCategories();
            setIsEditDialogOpen(false);
            setEditingCategoryId(null);
            resetForm();
            setMessage({ type: 'success', text: 'Categoria atualizada com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao atualizar categoria',
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (catId: string) => {
        setDeletingCategoryId(catId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategoryId) return;

        try {
            setCreating(true);
            await deleteCategory(deletingCategoryId);
            await loadCategories();
            setIsDeleteDialogOpen(false);
            setDeletingCategoryId(null);
            setMessage({ type: 'success', text: 'Categoria deletada com sucesso' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message || 'Erro ao deletar categoria',
            });
        } finally {
            setCreating(false);
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
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
                    <p className="text-muted-foreground mt-2">
                        {categories.filter(c => c.userId).length} categorias criadas
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova categoria
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                    <Card key={cat.idCategory} className="flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    {(() => {
                                        const IconComp = getIconComponent(cat.icon);
                                        return IconComp ? (
                                            <IconComp className="h-6 w-6 flex-shrink-0" style={{ color: cat.color }} />
                                        ) : (
                                            <div
                                                className="w-6 h-6 rounded flex-shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                        );
                                    })()}
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">{cat.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {cat.type}
                                        </CardDescription>
                                    </div>
                                </div>
                                {cat.userId && (
                                    <Badge variant="secondary">Pessoal</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {cat.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {cat.description}
                                </p>
                            )}
                        </CardContent>
                        {cat.userId && (
                            <div className="flex gap-2 p-4 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEditCategory(cat)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteClick(cat.idCategory)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova categoria</DialogTitle>
                        <DialogDescription>Crie uma nova categoria para suas despesas.</DialogDescription>
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
                                placeholder="Descrição desta categoria..."
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
                        <Button variant="outline" onClick={() => {
                            setIsCreateDialogOpen(false);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button onClick={handleCreateCategory} disabled={creating}>
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
                        <DialogTitle>Editar categoria</DialogTitle>
                        <DialogDescription>Atualize os detalhes da categoria.</DialogDescription>
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
                                placeholder="Descrição desta categoria..."
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
                        <Button variant="outline" onClick={() => {
                            setIsEditDialogOpen(false);
                            setEditingCategoryId(null);
                            resetForm();
                        }}>Cancelar</Button>
                        <Button onClick={handleSaveEditCategory} disabled={creating}>
                            {creating && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                            Atualizar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar categoria</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
