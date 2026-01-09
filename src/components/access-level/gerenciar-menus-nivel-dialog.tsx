"use client"
// src/components/access-level/gerenciar-menus-nivel-dialog.tsx

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { MenuAcesso, NivelAcesso } from "@/types/access-level"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

type NivelAcessoComMenus = NivelAcesso & { menus: MenuAcesso[] }

const formSchema = z.object({
    menuIds: z.array(z.number()),
})
type FormValues = z.infer<typeof formSchema>

interface GerenciarMenusNivelDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    nivel: NivelAcessoComMenus
    todosMenus: MenuAcesso[]
    onDataChanged: () => void
}

export function GerenciarMenusNivelDialog({
    isOpen,
    onOpenChange,
    nivel,
    todosMenus,
    onDataChanged,
}: GerenciarMenusNivelDialogProps) {

    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { setAlert } = useAlert()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            menuIds: nivel.menus.map(menu => menu.idMenuAcesso),
        },
    })

    React.useEffect(() => {
        form.reset({
            menuIds: nivel.menus.map(menu => menu.idMenuAcesso),
        })
    }, [nivel, form])

    async function onSubmit(data: FormValues) {
        setIsSubmitting(true)
        try {
            await api.put(`/admin/acesso/niveis/${nivel.idNivelAcesso}/menus`, data)
            setAlert("Menus do nível atualizados!", "success")
            onDataChanged()
        } catch (err: any) {
            setAlert(err.response?.data?.message || "Erro ao atualizar menus.", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciar Menus para "{nivel.nome}"</DialogTitle>
                    <DialogDescription>
                        Selecione os menus que este nível de acesso pode visualizar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            {todosMenus.map(menu => (
                                <FormField
                                    key={menu.idMenuAcesso}
                                    control={form.control}
                                    name="menuIds"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value.includes(menu.idMenuAcesso)}
                                                    onCheckedChange={checked => {
                                                        const newValue = [...field.value]
                                                        if (checked) {
                                                            newValue.push(menu.idMenuAcesso)
                                                        } else {
                                                            const index = newValue.indexOf(menu.idMenuAcesso)
                                                            if (index > -1) newValue.splice(index, 1)
                                                        }
                                                        field.onChange(newValue)
                                                    }}
                                                />
                                            </FormControl>
                                            <div>
                                                <FormLabel className="font-normal">{menu.nome}</FormLabel>
                                                <p className="text-xs text-muted-foreground">{menu.slug}</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Vínculos
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}