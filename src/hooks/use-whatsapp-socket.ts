import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  phoneNumber: string;
  contactName?: string;
  messageType: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
}

interface ConversationUpdate {
  phoneNumber: string;
  contactName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function useWhatsAppSocket(sessionId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [conversationUpdate, setConversationUpdate] = useState<ConversationUpdate | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Conecta ao namespace /whatsapp
    const socket = io(`${API_URL}/whatsapp`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setConnected(true);
      
      // Inscreve na sessão
      socket.emit('subscribe', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setConnected(false);
    });

    socket.on('new_message', (message: Message) => {
      console.log('📨 Nova mensagem via WebSocket:', message);
      setNewMessage(message);
    });

    socket.on('conversation_update', (update: ConversationUpdate) => {
      console.log('🔄 Atualização de conversa via WebSocket:', update);
      setConversationUpdate(update);
    });

    socket.on('message_status', (data: { messageId: string; status: string }) => {
      console.log('✅ Status de mensagem atualizado:', data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe', { sessionId });
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  return {
    connected,
    newMessage,
    conversationUpdate,
    clearNewMessage: () => setNewMessage(null),
    clearConversationUpdate: () => setConversationUpdate(null),
  };
}
