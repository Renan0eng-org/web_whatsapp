'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppWeb } from '@/hooks/use-whatsapp-web';
import { whatsappService } from '@/services/whatsapp.service';
import { AlertCircle, Check, Loader2, Webhook } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WhatsAppWebhookConfig() {
  const { sessions, refreshSessions } = useWhatsAppWeb();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const connectedSessions = sessions.filter(s => s.status?.toUpperCase() === 'CONNECTED');

  // Carrega configuração da sessão selecionada
  useEffect(() => {
    if (selectedSessionId) {
      const session = sessions.find(s => s.idSession === selectedSessionId || s.id === selectedSessionId);
      if (session) {
        setWebhookUrl(session.webhookUrl || '');
        setWebhookEnabled(session.webhookEnabled || false);
      }
    }
  }, [selectedSessionId, sessions]);

  const handleSave = async () => {
    if (!selectedSessionId) {
      setError('Selecione uma sessão');
      return;
    }

    if (webhookEnabled && !webhookUrl) {
      setError('Informe a URL do webhook');
      return;
    }

    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      await whatsappService.updateWebhookConfig(selectedSessionId, {
        webhookUrl,
        webhookEnabled,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      await refreshSessions();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            <CardTitle>Configuração do Webhook n8n</CardTitle>
          </div>
          <CardDescription>
            Configure o webhook para enviar mensagens recebidas automaticamente para o n8n
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Sessão */}
          <div className="space-y-2">
            <Label htmlFor="session">Sessão WhatsApp</Label>
            {connectedSessions.length === 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    Nenhuma sessão conectada. Conecte uma sessão na aba "Web (QR Code)" primeiro.
                  </p>
                </div>
              </div>
            ) : (
              <select
                id="session"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma sessão...</option>
                {connectedSessions.map((session) => {
                  const sessionId = session.idSession || session.id;
                  return (
                    <option key={sessionId} value={sessionId}>
                      {session.displayName || session.sessionName}
                      {session.phoneNumber && ` (${session.phoneNumber})`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {selectedSessionId && (
            <>
              {/* Ativar/Desativar Webhook */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="webhook-enabled">Webhook Ativado</Label>
                  <p className="text-sm text-gray-500">
                    Enviar mensagens recebidas para o n8n automaticamente
                  </p>
                </div>
                <Switch
                  id="webhook-enabled"
                  checked={webhookEnabled}
                  onCheckedChange={setWebhookEnabled}
                />
              </div>

              {/* URL do Webhook */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="http://localhost:5678/webhook-test/whatsapp-incoming"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  disabled={!webhookEnabled}
                />
                <p className="text-sm text-gray-500">
                  Teste: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5678/webhook-test/whatsapp-incoming</code>
                  <br />
                  Produção: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5678/webhook/whatsapp-incoming</code>
                </p>
              </div>

              {/* Formato do Payload */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="font-medium text-blue-900 mb-2">Formato do Payload Enviado</h4>
                <pre className="bg-white rounded p-3 text-xs overflow-x-auto">
{`{
  "phone": "5544991234567",
  "message": "Conteúdo da mensagem",
  "sessionId": "id-da-sessao"
}`}
                </pre>
                <p className="text-sm text-blue-800 mt-2">
                  O número do telefone virá sem o <code>@c.us</code>
                </p>
              </div>

              {/* Mensagens de Feedback */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-5 w-5" />
                    <p className="text-sm">Configuração salva com sucesso!</p>
                  </div>
                </div>
              )}

              {/* Botão Salvar */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configuração'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. WhatsApp recebe mensagem</h4>
            <p className="text-gray-600">Quando alguém envia uma mensagem para seu WhatsApp</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. API processa e salva</h4>
            <p className="text-gray-600">A mensagem é salva no banco de dados</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">3. POST para n8n</h4>
            <p className="text-gray-600">Se o webhook estiver ativo, envia POST para o n8n</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">4. Agent gera resposta</h4>
            <p className="text-gray-600">O workflow do n8n processa e gera resposta com IA</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">5. n8n envia resposta</h4>
            <p className="text-gray-600">O n8n chama <code className="bg-gray-100 px-2 py-1 rounded">/whatsapp/web/send</code> para enviar a resposta</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
