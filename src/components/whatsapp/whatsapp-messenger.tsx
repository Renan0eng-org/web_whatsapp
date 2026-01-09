'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWhatsAppMessages } from '@/hooks/use-whatsapp-messages';
import { useWhatsAppSocket } from '@/hooks/use-whatsapp-socket';
import { whatsappService } from '@/services/whatsapp.service';
import { AlertCircle, Loader2, MessageCircle, Phone, Search, Send, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WhatsAppMessagesProps {
  configId?: string;
  sessionId?: string;
}

interface Conversation {
  phoneNumber: string;
  contactName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  profilePicUrl?: string | null;
  isGroup?: boolean;
}

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

export function WhatsAppMessenger({ configId, sessionId }: WhatsAppMessagesProps) {
  const { messages, loading, sendMessage } = useWhatsAppMessages(configId || '');
  const { connected, newMessage, conversationUpdate, clearNewMessage, clearConversationUpdate } = useWhatsAppSocket(sessionId);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [contactMessages, setContactMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const isWebSession = !!sessionId;

  // Carrega conversas do cache ao iniciar
  useEffect(() => {
    if (isWebSession && sessionId) {
      const cacheKey = `whatsapp_conversations_${sessionId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setConversations(JSON.parse(cached));
        } catch (error) {
          console.error('Erro ao carregar cache:', error);
        }
      }
    }
  }, [isWebSession, sessionId]);

  // Carrega conversas para sessões Web (uma vez)
  useEffect(() => {
    if (isWebSession && sessionId) {
      loadConversations();
    }
  }, [isWebSession, sessionId]);

  // Carrega mensagens do contato selecionado
  useEffect(() => {
    if (selectedContact && sessionId) {
      setMessageOffset(0);
      setHasMoreMessages(true);
      
      const msgCacheKey = `whatsapp_messages_${sessionId}_${selectedContact}`;
      const cachedMessages = localStorage.getItem(msgCacheKey);
      if (cachedMessages) {
        try {
          setContactMessages(JSON.parse(cachedMessages));
        } catch (error) {
          setContactMessages([]);
        }
      } else {
        setContactMessages([]);
      }
      
      loadContactMessages(0);
    }
  }, [selectedContact, sessionId]);

  // Processa nova mensagem via WebSocket
  useEffect(() => {
    if (newMessage) {
      if (selectedContact && newMessage.phoneNumber === selectedContact) {
        setContactMessages(prev => {
          // Remove mensagens temporárias com o mesmo conteúdo
          const withoutTemp = prev.filter(msg => 
            !(msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.direction === 'OUTBOUND')
          );
          
          // Verifica se a mensagem já existe (evita duplicação)
          const exists = withoutTemp.some(msg => msg.id === newMessage.id);
          if (exists) {
            return withoutTemp; // Retorna sem adicionar duplicata
          }
          
          return [...withoutTemp, newMessage];
        });
      }
      clearNewMessage();
    }
  }, [newMessage, selectedContact, clearNewMessage]);

  // Processa atualização de conversa via WebSocket
  useEffect(() => {
    if (conversationUpdate) {
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.phoneNumber === conversationUpdate.phoneNumber);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: conversationUpdate.lastMessage,
            lastMessageTime: conversationUpdate.lastMessageTime,
            unreadCount: selectedContact === conversationUpdate.phoneNumber 
              ? 0 
              : (updated[existingIndex].unreadCount || 0) + conversationUpdate.unreadCount,
          };
          
          const [item] = updated.splice(existingIndex, 1);
          return [item, ...updated];
        } else {
          return [{
            phoneNumber: conversationUpdate.phoneNumber,
            contactName: conversationUpdate.contactName,
            lastMessage: conversationUpdate.lastMessage,
            lastMessageTime: conversationUpdate.lastMessageTime,
            unreadCount: conversationUpdate.unreadCount,
            profilePicUrl: null,
            isGroup: false,
          }, ...prev];
        }
      });
      
      clearConversationUpdate();
    }
  }, [conversationUpdate, selectedContact, clearConversationUpdate]);

  const loadConversations = async () => {
    if (!sessionId) return;
    
    setLoadingConversations(true);
    try {
      const data = await whatsappService.getWebConversations(sessionId, 10);
      setConversations(data);
      
      const cacheKey = `whatsapp_conversations_${sessionId}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadContactMessages = async (offset: number = 0) => {
    if (!sessionId || !selectedContact) return;
    
    if (offset === 0) {
      setLoadingMessages(true);
    } else {
      setLoadingMoreMessages(true);
    }
    
    try {
      const data = await whatsappService.getWebMessagesByContact(
        sessionId, 
        selectedContact,
        10,
        offset
      );
      
      if (data.length < 10) {
        setHasMoreMessages(false);
      }
      
      if (offset === 0) {
        setContactMessages(data);
        const msgCacheKey = `whatsapp_messages_${sessionId}_${selectedContact}`;
        localStorage.setItem(msgCacheKey, JSON.stringify(data));
      } else {
        // Adiciona novas mensagens evitando duplicatas
        setContactMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = data.filter((msg: Message) => !existingIds.has(msg.id));
          return [...newMessages, ...prev];
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    if (element.scrollTop === 0 && !loadingMoreMessages && hasMoreMessages) {
      const newOffset = messageOffset + 10;
      setMessageOffset(newOffset);
      loadContactMessages(newOffset);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetPhone = selectedContact || phoneNumber;
    
    if (!targetPhone || !message) {
      return;
    }

    const messageToSend = message;
    
    try {
      if (isWebSession && sessionId) {
        // Adiciona mensagem otimisticamente ao chat
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          phoneNumber: targetPhone,
          messageType: 'TEXT',
          direction: 'OUTBOUND',
          status: 'SENDING',
          content: messageToSend,
          createdAt: new Date().toISOString(),
        };
        
        if (selectedContact === targetPhone) {
          setContactMessages(prev => [...prev, optimisticMessage]);
        }
        
        setMessage('');
        
        await whatsappService.sendWebMessage(sessionId, {
          phoneNumber: targetPhone,
          message: messageToSend,
        });
        
        // Apenas recarrega a lista de conversações (não as mensagens, pois já adicionamos otimisticamente)
        await loadConversations();
      } else if (configId) {
        await sendMessage({
          phoneNumber: targetPhone,
          message: messageToSend,
        });
        setMessage('');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique o console.');
    }
  };

  const filteredConversations = searchTerm 
    ? conversations.filter(conv =>
        conv.phoneNumber.includes(searchTerm) ||
        conv.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  const formatPhoneNumber = (phone: string) => {
    if (phone.length >= 10) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4)}`;
    }
    return phone;
  };

  // Layout de Chat para WhatsApp Web 
  if (isWebSession) {
    return (
      <div className="grid gap-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-800">
            <MessageCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Chat WhatsApp Web - {connected ? '🟢 Conectado' : '🔴 Desconectado'} ao WebSocket
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 ">
          {/* Lista de Conversas */}
          <Card className="md:col-span-1 max-h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg">Conversas</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => loadConversations()}
                  disabled={loadingConversations}
                  className="h-8 w-8"
                >
                  <Loader2 className={`h-4 w-4 ${loadingConversations ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <div className="h-full overflow-y-auto scrollable">
                {loadingConversations && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {conversations.length === 0 ? 'Nenhuma conversa ainda' : 'Nenhum resultado'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.phoneNumber}
                        onClick={() => {
                          setSelectedContact(conv.phoneNumber);
                          setPhoneNumber('');
                          
                          // Zera o contador de mensagens não lidas ao abrir a conversa
                          setConversations(prev => 
                            prev.map(c => 
                              c.phoneNumber === conv.phoneNumber 
                                ? { ...c, unreadCount: 0 }
                                : c
                            )
                          );
                        }}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                          selectedContact === conv.phoneNumber ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {conv.profilePicUrl ? (
                              <img 
                                src={conv.profilePicUrl} 
                                alt={conv.contactName || conv.phoneNumber}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<svg class="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                                  }
                                }}
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conv.contactName || formatPhoneNumber(conv.phoneNumber)}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(conv.lastMessageTime).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {conv.unreadCount > 0 && (
                                  <span className="flex items-center justify-center bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5">
                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Área de Chat */}
          <Card className="md:col-span-2 flex flex-col max-h-[calc(100vh-200px)]">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedContact ? (
                  <>
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {(() => {
                        const conv = conversations.find(c => c.phoneNumber === selectedContact);
                        return conv?.profilePicUrl ? (
                          <img 
                            src={conv.profilePicUrl} 
                            alt={conv.contactName || conv.phoneNumber}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        );
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {conversations.find(c => c.phoneNumber === selectedContact)?.contactName || formatPhoneNumber(selectedContact)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        <Phone className="inline h-3 w-3 mr-1" />
                        {formatPhoneNumber(selectedContact)}
                      </CardDescription>
                    </div>
                  </>
                ) : (
                  <div>
                    <CardTitle className="text-lg">Nova Conversa</CardTitle>
                    <CardDescription>Digite o número do telefone abaixo</CardDescription>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <div 
                className="flex-1 p-4 overflow-y-auto scrollable" 
                onScroll={handleScroll}
              >
                {selectedContact ? (
                  <>
                    {loadingMoreMessages && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="ml-2 text-xs text-gray-500">Carregando mais mensagens...</span>
                      </div>
                    )}
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : contactMessages.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                        Nenhuma mensagem ainda
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contactMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.direction === 'OUTBOUND'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                              <span className={`text-xs mt-1 block ${
                                msg.direction === 'OUTBOUND' ? 'text-green-100' : 'text-gray-600'
                              }`}>
                                {new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500">
                    Selecione uma conversa ou digite um número para iniciar
                  </div>
                )}
              </div>

              <div className="border-t p-4 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  {!selectedContact && (
                    <Input
                      placeholder="Número de telefone (ex: 5544991024020)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      className="self-end"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Layout simples para WhatsApp Business API
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensagem</CardTitle>
          <CardDescription>
            Digite o número do telefone e a mensagem (via WhatsApp Business API)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input
                id="phone"
                placeholder="Ex: 55 11 98765-4321"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                rows={4}
              />
            </div>

            <Button type="submit" disabled={isSending || loading} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>
            {messages.length === 0 ? 'Nenhuma mensagem ainda' : `${messages.length} mensagens`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Nenhuma mensagem encontrada. Envie a primeira mensagem!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${
                    msg.direction === 'OUTBOUND'
                      ? 'ml-8 bg-blue-100 text-blue-900'
                      : 'mr-8 bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{msg.phoneNumber}</p>
                      <p className="mt-1 break-words">{msg.content}</p>
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
