'use client';

import { Button } from '@/components/ui/button';
import { formatDateUTC } from '@/lib/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWhatsAppConfig } from '@/hooks/use-whatsapp-config';
import { AlertCircle, Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function WhatsAppConfigForm() {
  const { configs, loading, createConfig, deleteConfig } = useWhatsAppConfig();
  const [activeTab, setActiveTab] = useState('view');
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    displayName: '',
    webhookUrl: '',
    verifyToken: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConfig(formData);
      setFormData({
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        displayName: '',
        webhookUrl: '',
        verifyToken: '',
      });
      setActiveTab('view');
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
    }
  };

  const handleDelete = async (configId: string) => {
    if (window.confirm('Tem certeza que deseja deletar essa configuração?')) {
      try {
        await deleteConfig(configId);
      } catch (error) {
        console.error('Erro ao deletar configuração:', error);
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">Minhas Configurações</TabsTrigger>
          <TabsTrigger value="create">Nova Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Nenhuma configuração de WhatsApp cadastrada. Crie uma nova para começar!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {config.displayName || 'Configuração WhatsApp'}
                        </CardTitle>
                        <CardDescription>
                          Telefone: {config.phoneNumberId}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            config.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {config.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 text-sm">
                      <div className="flex items-center justify-between rounded bg-gray-50 p-2">
                        <span className="text-gray-600">Business Account:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">{config.businessAccountId}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(config.businessAccountId, 'Business Account ID')
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Criado em:</span>
                        <span>{formatDateUTC(config.createdAt)}</span>
                      </div>
                      {config.webhookUrl && (
                        <div className="flex items-center justify-between rounded bg-gray-50 p-2">
                          <span className="text-gray-600">Webhook URL:</span>
                          <code className="text-xs font-mono">{config.webhookUrl}</code>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        disabled={loading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Configuração</CardTitle>
              <CardDescription>
                Configure sua integração com WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Nome da Configuração</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Ex: WhatsApp Principal"
                    value={formData.displayName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accessToken">
                    Access Token <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accessToken"
                    name="accessToken"
                    type="password"
                    placeholder="Cole seu access token"
                    value={formData.accessToken}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Obtido no{' '}
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Facebook Developers
                    </a>
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phoneNumberId">
                    Phone Number ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumberId"
                    name="phoneNumberId"
                    placeholder="Ex: 1234567890123"
                    value={formData.phoneNumberId}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    ID do número de telefone registrado no WhatsApp Business
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="businessAccountId">
                    Business Account ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessAccountId"
                    name="businessAccountId"
                    placeholder="Ex: 9876543210987"
                    value={formData.businessAccountId}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    name="webhookUrl"
                    placeholder="https://seu-dominio.com/api/whatsapp/webhook"
                    value={formData.webhookUrl}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">
                    URL para receber mensagens em tempo real
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="verifyToken">Verify Token</Label>
                  <Input
                    id="verifyToken"
                    name="verifyToken"
                    placeholder="Token para validação do webhook"
                    value={formData.verifyToken}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">
                    Use a mesma valor configurado no Meta App Manager
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? 'Criando...' : 'Criar Configuração'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
