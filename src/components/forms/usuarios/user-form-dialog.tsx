"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/hooks/use-alert"
import { userCreateFormSchema, userUpdateFormSchema } from "@/schemas/usuario"
import api from "@/services/api"
import { EnumUserType, NivelAcesso, UserComNivel, UserFormData } from "@/types/access-level"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

interface UserFormDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    userToEdit: UserComNivel | null // Usuário para editar (null se for criação)
    niveisAcesso: NivelAcesso[]
    onUserSaved: () => void // Callback para recarregar
}

export function UserFormDialog({
    isOpen,
    onOpenChange,
    userToEdit,
    niveisAcesso,
    onUserSaved,
}: UserFormDialogProps) {

    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const { setAlert } = useAlert()
    const isEditing = !!userToEdit;

    // se for edição, userUpdateFormSchema
    // se for criação, userCreateFormSchema

    const schema = isEditing ? userUpdateFormSchema : userCreateFormSchema;

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            avatar: null,
            cpf: "",
            cep: null,
            phone: null,
            nivelAcessoId: "1",
            type: EnumUserType.USUARIO,
            active: true,
        },
    })

    // Popula o formulário ao editar
    React.useEffect(() => {
        if (userToEdit) {
            form.reset({
                name: userToEdit.name,
                email: userToEdit.email,
                avatar: userToEdit.avatar,
                cpf: userToEdit.cpf || "111.111.111-11",
                cep: userToEdit.cep,
                phone: userToEdit.phone,
                nivelAcessoId: String(userToEdit.nivel_acesso.idNivelAcesso),
                type: userToEdit.type,
                active: userToEdit.active,
            })
        } else {
            form.reset({
                name: "",
                email: "",
                avatar: null,
                cpf: "",
                cep: null,
                phone: null,
                nivelAcessoId: "1",
                type: EnumUserType.USUARIO,
                active: true,
            })
        }
    }, [userToEdit, form, isOpen,])

    React.useEffect(() => {
        if (form.watch("type") === EnumUserType.PACIENTE) {
            const nivelPaciente = niveisAcesso.find(n => n.nome.toLowerCase() === "paciente")
            if (nivelPaciente) {
                form.setValue("nivelAcessoId", String(nivelPaciente.idNivelAcesso))
            }
        }
    }, [form, niveisAcesso, form.watch("type")]);

    async function onSubmit(values: z.infer<typeof schema>) {
        setIsSubmitting(true);

        const payload: UserFormData = {
            ...values,
            nivelAcessoId: parseInt(values.nivelAcessoId, 10),
            cpf: values.cpf ?? "111.111.111-11",
        } as UserFormData;
        delete payload.passwordConfirmation;


        try {
            if (isEditing) {
                await api.put(`/admin/users/${userToEdit.idUser}`, payload);
                setAlert("Usuário atualizado com sucesso!", "success");
            } else {
                await api.post('/admin/users', payload);
                setAlert("Usuário criado com sucesso!", "success");
            }
            onUserSaved();
        } catch (err: any) {
            console.error("Erro ao salvar usuário:", err);
            setAlert(err.response?.data?.message || "Erro ao salvar usuário.", "error");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset();
        }
        onOpenChange(open);
    }


    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? `Editando informações de ${userToEdit?.name}.` : "Preencha os dados do novo usuário."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Completo*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do usuário" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail*</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* password */}
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha{isEditing ? " (deixe em branco para manter a atual)" : "*"}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="passwordConfirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmação de Senha{isEditing ? " (deixe em branco para manter a atual)" : "*"}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirme a senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF</FormLabel>
                                    <FormControl>
                                        <Input placeholder="000.000.000-00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nivelAcessoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nível de Acesso*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {niveisAcesso.filter(nivel => nivel.idNivelAcesso !== 2).map(nivel => (
                                                    <SelectItem key={nivel.idNivelAcesso} value={String(nivel.idNivelAcesso)}>
                                                        {nivel.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Usuário*</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {/* remove   
                                                    ADMIN = "ADMIN",
                                                    PACIENTE = "PACIENTE", 
                                                */}
                                                {Object.values(EnumUserType)
                                                    .filter(typeValue => typeValue !== "ADMIN" && typeValue !== "PACIENTE")
                                                    .map(typeValue => (
                                                        <SelectItem key={typeValue} value={typeValue}>
                                                            {typeValue}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEditing ? "Salvar Alterações" : "Criar Usuário"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}