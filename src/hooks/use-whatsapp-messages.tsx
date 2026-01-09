'use client';

import { SendMessagePayload, WhatsAppMessage, whatsappService } from '@/services/whatsapp.service';
import { useCallback, useEffect, useState } from 'react';
import { useAlert } from './use-alert';

export function useWhatsAppMessages(configId: string) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const { setAlert } = useAlert();

  const loadMessages = useCallback(async () => {
    if (!configId) return;

    try {
      setLoading(true);
      const data = await whatsappService.getMessages(configId, limit, offset);
      setMessages(data.messages);
      setTotal(data.total);
    } catch (error: any) {
      setAlert('Erro ao carregar mensagens: ' + (error.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  }, [configId, limit, offset]);
  const loadMessagesByPhone = useCallback(
    async (phoneNumber: string) => {
      if (!configId || !phoneNumber) return;

      try {
        setLoading(true);
        const data = await whatsappService.getMessagesByPhone(configId, phoneNumber);
        setMessages(data);
        setSelectedPhone(phoneNumber);
      } catch (error: any) {
        setAlert('Erro ao carregar mensagens: ' + (error.message || ''), 'error');
      } finally {
        setLoading(false);
      }
    },
    [configId],
  );

  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!configId) {
        setAlert('Nenhuma configuração selecionada', 'error');
        return;
      }

      try {
        setLoading(true);
        const result = await whatsappService.sendMessage(configId, payload);
        setAlert('Mensagem enviada com sucesso', 'success');
        // Recarregar mensagens após envio
        if (selectedPhone) {
          await loadMessagesByPhone(selectedPhone);
        } else {
          await loadMessages();
        }
        return result;
      } catch (error: any) {
        setAlert('Erro ao enviar mensagem: ' + (error.message || ''), 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [configId, loadMessages, loadMessagesByPhone, selectedPhone],
  );

  useEffect(() => {
    if (configId && !selectedPhone) {
      loadMessages();
    }
  }, [configId, selectedPhone, loadMessages]);

  return {
    messages,
    selectedPhone,
    setSelectedPhone,
    loading,
    total,
    offset,
    setOffset,
    limit,
    loadMessages,
    loadMessagesByPhone,
    sendMessage,
  };
}
