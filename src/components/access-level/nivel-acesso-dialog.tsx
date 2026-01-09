"use client"
// src/components/access-level/nivel-acesso-dialog.tsx

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { NivelAcesso } from "@/types/access-level"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const nivelAcessoSchema = z.object({
    nome: z.string().min(3, "O nome é obrigatório."),
    descricao: z.string().optional(),
})
type NivelAcessoFormValues = z.infer<typeof nivelAcessoSchema>

interface NivelAcessoDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    nivel: NivelAcesso | null
    onDataChanged: () => void
}

export function NivelAcessoDialog({ isOpen, onOpenChange, nivel, onDataChanged }: NivelAcessoDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { setAlert } = useAlert()

    const form = useForm<NivelAcessoFormValues>({
        resolver: zodResolver(nivelAcessoSchema),
        defaultValues: { nome: "", descricao: "" },
    })

    React.useEffect(() => {
        if (nivel) {
            form.reset({
                nome: nivel.nome,
                descricao: nivel.descricao || "",
            })
        } else {
            form.reset({ nome: "", descricao: "" })
        }
    }, [nivel, form])

    async function onSubmit(data: NivelAcessoFormValues) {
        setIsSubmitting(true)
        try {
            if (nivel) {
                await api.put(`/admin/acesso/niveis/${nivel.idNivelAcesso}`, data)
                setAlert("Nível atualizado!", "success")
            } else {
                await api.post('/admin/acesso/niveis', data)
                setAlert("Nível criado!", "success")
            }
            onDataChanged()
            onOpenChange(false)
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao salvar nível.", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) form.reset()
        onOpenChange(open)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{nivel ? "Editar" : "Criar Novo"} Nível de Acesso</DialogTitle>
                    <DialogDescription>
                        Defina um nome e descrição para o nível.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Administrador" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="descricao"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ex: Permite gerenciar usuários e configurações." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}