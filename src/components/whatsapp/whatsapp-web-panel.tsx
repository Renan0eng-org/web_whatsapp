"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWhatsAppWeb } from "@/hooks/use-whatsapp-web";
import { Phone, Plus, Power, QrCode, RefreshCcw, Wifi } from "lucide-react";
import { useState } from "react";

function statusClasses(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "CONNECTED":
      return "bg-green-100 text-green-800";
    case "DISCONNECTED":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING":
    default:
      return "bg-blue-100 text-blue-800";
  }
}

export function WhatsAppWebPanel() {
  const {
    sessions,
    selectedSession,
    setSelectedSessionId,
    loading,
    createSession,
    refreshSession,
    deleteSession,
  } = useWhatsAppWeb();

  const [formData, setFormData] = useState({
    sessionName: "",
    displayName: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.sessionName.trim()) return;
    await createSession({
      sessionName: formData.sessionName.trim(),
      displayName: formData.displayName.trim() || undefined,
    });
    setFormData({ sessionName: "", displayName: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Web (não oficial)</CardTitle>
          <CardDescription>
            Crie sessões baseadas no whatsapp-web.js, escaneie o QR Code e acompanhe o status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
              <TabsTrigger value="new">Nova Sessão</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4 space-y-4">
              {sessions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhuma sessão criada. Adicione uma nova para gerar o QR Code.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sessions.map((session) => {
                    const sessionId = session.idSession || session.id;
                    return (
                      <Card
                        key={sessionId}
                        className={`cursor-pointer transition hover:border-primary ${
                          sessionId === (selectedSession?.idSession || selectedSession?.id)
                            ? "border-primary"
                            : ""
                        }`}
                        onClick={() => sessionId && setSelectedSessionId(sessionId)}
                      >
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                          <div>
                            <CardTitle className="text-base">{session.displayName || session.sessionName}</CardTitle>
                            <CardDescription>{session.sessionName}</CardDescription>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(session.status)}`}>
                            {session.status || "PENDING"}
                          </span>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><Wifi className="h-4 w-4" />Status: {session.status || "PENDING"}</div>
                          <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{session.phoneNumber || "Número não vinculado"}</div>
                          <div className="flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Última atualização: {session.updatedAt ? new Date(session.updatedAt).toLocaleString("pt-BR") : "-"}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                sessionId && refreshSession(sessionId);
                              }}
                              disabled={loading}
                            >
                              <RefreshCcw className="mr-2 h-4 w-4" />Atualizar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sessionId) deleteSession(sessionId);
                              }}
                              disabled={loading}
                            >
                              <Power className="mr-2 h-4 w-4" />Encerrar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {selectedSession && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle>Detalhes da sessão</CardTitle>
                    <CardDescription>Use o QR Code para conectar no WhatsApp Web.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="rounded bg-gray-100 px-3 py-1">Nome: {selectedSession.sessionName}</span>
                      <span className="rounded bg-gray-100 px-3 py-1">Status: {selectedSession.status}</span>
                      {selectedSession.phoneNumber && (
                        <span className="rounded bg-gray-100 px-3 py-1">Número: {selectedSession.phoneNumber}</span>
                      )}
                    </div>
                    <Separator />
                    <div className="flex flex-col items-center justify-center gap-4">
                      {selectedSession.qrCode ? (
                        <img
                          src={`data:image/png;base64,${selectedSession.qrCode}`}
                          alt="QR Code da sessão"
                          className="h-auto w-64 rounded-lg border"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                          <QrCode className="h-10 w-10" />
                          <span>QR Code ainda não disponível. Atualize a sessão após iniciar o cliente backend.</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const id = selectedSession.idSession || selectedSession.id;
                          if (id) refreshSession(id);
                        }}
                        disabled={loading}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />Recarregar QR Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="new" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="sessionName">Nome da sessão</Label>
                  <Input
                    id="sessionName"
                    name="sessionName"
                    placeholder="ex: suporte-loja"
                    value={formData.sessionName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sessionName: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Nome de exibição (opcional)</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="ex: Suporte Loja"
                    value={formData.displayName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Criando..." : "Criar sessão"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
