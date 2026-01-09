"use client"
// src/components/access-level/usuario-nivel-dialog.tsx

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/hooks/use-alert"
import api from "@/services/api"
import { NivelAcesso, UserComNivel } from "@/types/access-level"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  nivelAcessoId: z.string().min(1, "Selecione um nível de acesso."),
})
type FormValues = z.infer<typeof formSchema>

interface UsuarioNivelDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  user: UserComNivel
  niveisDisponiveis: NivelAcesso[]
  onDataChanged: () => void
}

export function UsuarioNivelDialog({
  isOpen,
  onOpenChange,
  user,
  niveisDisponiveis,
  onDataChanged,
}: UsuarioNivelDialogProps) {
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { setAlert } = useAlert()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nivelAcessoId: String(user.nivel_acesso.idNivelAcesso),
    },
  })
  
  React.useEffect(() => {
    form.reset({
      nivelAcessoId: String(user.nivel_acesso.idNivelAcesso),
    })
  }, [user, form])

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        nivelAcessoId: parseInt(data.nivelAcessoId, 10),
      }

      await api.patch(`/admin/acesso/users/${user.idUser}/nivel`, payload)
      
      setAlert("Nível do usuário atualizado!", "success")
      onDataChanged()
    } catch (err: any) {
      setAlert(err.response?.data?.message || "Erro ao atualizar o nível.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Nível de Acesso</DialogTitle>
          <DialogDescription>
            Editando nível de: <span className="font-medium">{user.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nivelAcessoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Acesso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um nível..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {niveisDisponiveis.map(nivel => (
                        <SelectItem
                          key={nivel.idNivelAcesso}
                          value={String(nivel.idNivelAcesso)}
                        >
                          {nivel.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}