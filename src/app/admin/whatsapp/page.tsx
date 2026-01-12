'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppConfigForm, WhatsAppMessenger, WhatsAppWebPanel, WhatsAppWebhookConfig } from '@/components/whatsapp';
import { useWhatsAppConfig } from '@/hooks/use-whatsapp-config';
import { useWhatsAppWeb } from '@/hooks/use-whatsapp-web';
import { QrCode, Send, Webhook } from 'lucide-react';
import { useState } from 'react';

export default function WhatsAppPage() {
  const { configs, selectedConfig, setSelectedConfig } = useWhatsAppConfig();
  const { sessions } = useWhatsAppWeb();
  const [activeTab, setActiveTab] = useState('config');
  const [selectedSource, setSelectedSource] = useState<'api' | 'web'>('api');
  const [selectedWebSessionId, setSelectedWebSessionId] = useState<string>('');

  // Filtra apenas sessões conectadas
  const connectedSessions = sessions.filter(
    (s) => s.status?.toUpperCase() === 'CONNECTED'
  );

  // Verifica se há alguma fonte disponível
  const hasApiConfigs = configs.length > 0;
  const hasConnectedSessions = connectedSessions.length > 0;
  const canSendMessages = hasApiConfigs || hasConnectedSessions;

  return (
    <div className="space-y-6 p-2 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
        <p className="text-gray-600">
          Gerencie suas configurações e envie mensagens via WhatsApp
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2">
          <TabsTrigger value="web">
            <QrCode className="mr-2 h-4 w-4" />
            Web (QR Code)
          </TabsTrigger>
          <TabsTrigger value="messenger" disabled={!canSendMessages}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Mensagens
          </TabsTrigger>
          <TabsTrigger value="webhook">
            <Webhook className="mr-2 h-4 w-4" />
            Webhook n8n
          </TabsTrigger>
          {/* <TabsTrigger value="config">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <WhatsAppConfigForm />
        </TabsContent>

        <TabsContent value="messenger" className="mt-6">
          {canSendMessages && (
            <div className="space-y-6">
              {/* Seletor de Fonte */}
              <div className="grid gap-4 md:grid-cols-2">
                {hasApiConfigs && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usar WhatsApp Business API
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedSource('api')}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        selectedSource === 'api'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">API Oficial</div>
                      <div className="text-sm text-gray-600">
                        {configs.length} configuração(ões) disponível(is)
                      </div>
                    </button>
                  </div>
                )}

                {hasConnectedSessions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usar WhatsApp Web (não oficial)
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedSource('web')}
                      className={`w-full rounded-lg border-2 p-4 text-left transition ${
                        selectedSource === 'web'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">WhatsApp Web</div>
                      <div className="text-sm text-gray-600">
                        {connectedSessions.length} sessão(ões) conectada(s)
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Seleção de Configuração ou Sessão */}
              {selectedSource === 'api' && hasApiConfigs && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione uma Configuração
                  </label>
                  <select
                    value={selectedConfig?.id || ''}
                    onChange={(e) => {
                      const config = configs.find((c) => c.id === e.target.value);
                      setSelectedConfig(config || null);
                    }}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Escolha uma configuração...</option>
                    {configs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.displayName || `Configuração ${config.phoneNumberId}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedSource === 'web' && hasConnectedSessions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione uma Sessão Web
                  </label>
                  <select
                    value={selectedWebSessionId}
                    onChange={(e) => setSelectedWebSessionId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Escolha uma sessão...</option>
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
                </div>
              )}

              {/* Componente de Mensagens */}
              {selectedSource === 'api' && selectedConfig && (
                <WhatsAppMessenger configId={selectedConfig.id} />
              )}

              {selectedSource === 'web' && selectedWebSessionId && (
                <WhatsAppMessenger sessionId={selectedWebSessionId} />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhook" className="mt-6">
          <WhatsAppWebhookConfig />
        </TabsContent>

        <TabsContent value="web" className="mt-6">
          <WhatsAppWebPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
