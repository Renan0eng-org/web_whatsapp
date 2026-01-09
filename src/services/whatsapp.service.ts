import api from "./api";


export interface WhatsAppConfig {
  id: string;
  phoneNumberId: string;
  businessAccountId: string;
  displayName?: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  contactName?: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  content: string;
  mediaUrl?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppWebSession {
  id?: string;
  idSession?: string;
  sessionName: string;
  displayName?: string;
  status: string;
  phoneNumber?: string | null;
  qrCode?: string | null;
  webhookUrl?: string | null;
  webhookEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendMessagePayload {
  phoneNumber: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
}

class WhatsAppService {
  async createConfig(data: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    displayName?: string;
    webhookUrl?: string;
    verifyToken?: string;
  }) {
    const response = await api.post('/whatsapp/config', data);
    return response.data;
  }

  async updateConfig(
    configId: string,
    data: Partial<{
      accessToken: string;
      phoneNumberId: string;
      businessAccountId: string;
      displayName?: string;
      webhookUrl?: string;
      verifyToken?: string;
    }>,
  ) {
    const response = await api.put(`/whatsapp/config/${configId}`, data);
    return response.data;
  }

  async getConfig(configId: string): Promise<WhatsAppConfig> {
    const response = await api.get(`/whatsapp/config/${configId}`);
    return response.data;
  }

  async getConfigs(): Promise<WhatsAppConfig[]> {
    const response = await api.get('/whatsapp/configs');
    return response.data;
  }

  async deleteConfig(configId: string) {
    const response = await api.delete(`/whatsapp/config/${configId}`);
    return response.data;
  }

  async sendMessage(
    configId: string,
    payload: SendMessagePayload,
  ) {
    const response = await api.post('/whatsapp/send', payload, {
      params: { configId },
    });
    return response.data;
  }

  async getMessages(
    configId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    messages: WhatsAppMessage[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await api.get('/whatsapp/messages', {
      params: { configId, limit, offset },
    });
    return response.data;
  }

  async getMessagesByPhone(
    configId: string,
    phoneNumber: string,
  ): Promise<WhatsAppMessage[]> {
    const response = await api.get(`/whatsapp/messages/${phoneNumber}`, {
      params: { configId },
    });
    return response.data;
  }

  async createWebSession(data: { sessionName: string; displayName?: string }) {
    const response = await api.post('/whatsapp/web/session', data);
    return response.data as WhatsAppWebSession;
  }

  async getWebSessions(): Promise<WhatsAppWebSession[]> {
    const response = await api.get('/whatsapp/web/sessions');
    return response.data as WhatsAppWebSession[];
  }

  async getWebSession(sessionId: string): Promise<WhatsAppWebSession> {
    const response = await api.get(`/whatsapp/web/session/${sessionId}`);
    return response.data as WhatsAppWebSession;
  }

  async deleteWebSession(sessionId: string) {
    const response = await api.delete(`/whatsapp/web/session/${sessionId}`);
    return response.data;
  }

  async sendWebMessage(
    sessionId: string,
    payload: Pick<SendMessagePayload, 'phoneNumber' | 'message'>,
  ) {
    const response = await api.post('/whatsapp/web/send', payload, {
      params: { sessionId },
    });
    return response.data;
  }

  async getWebConversations(sessionId: string, limit: number = 10) {
    const response = await api.get('/whatsapp/web/conversations', {
      params: { sessionId, limit },
    });
    return response.data;
  }

  async getContactProfilePic(sessionId: string, phoneNumber: string) {
    const response = await api.get(`/whatsapp/web/contact/${phoneNumber}/profile-pic`, {
      params: { sessionId },
    });
    return response.data;
  }

  async getWebMessagesByContact(
    sessionId: string, 
    phoneNumber: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    const response = await api.get(`/whatsapp/web/messages/${phoneNumber}`, {
      params: { sessionId, limit, offset },
    });
    return response.data;
  }

  async updateWebhookConfig(
    sessionId: string,
    data: { webhookUrl: string; webhookEnabled: boolean },
  ) {
    const response = await api.put(`/whatsapp/web/session/${sessionId}/webhook`, data);
    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
