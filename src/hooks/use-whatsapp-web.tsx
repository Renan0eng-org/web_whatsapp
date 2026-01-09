"use client";

import { WhatsAppWebSession, whatsappService } from "@/services/whatsapp.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlert } from "./use-alert";

function resolveSessionId(session?: WhatsAppWebSession | null) {
  return session?.idSession || session?.id || null;
}

export function useWhatsAppWeb() {
  const [sessions, setSessions] = useState<WhatsAppWebSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAlert } = useAlert();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await whatsappService.getWebSessions();
      setSessions(data);
      if (!selectedSessionId && data.length > 0) {
        setSelectedSessionId(resolveSessionId(data[0]));
      }
    } catch (error: any) {
      setAlert("Erro ao carregar sessões: " + (error?.message || ""), "error");
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId, setAlert]);

  const createSession = useCallback(
    async (payload: { sessionName: string; displayName?: string }) => {
      try {
        setLoading(true);
        const session = await whatsappService.createWebSession(payload);
        setAlert("Sessão criada. Escaneie o QR Code para conectar.", "success");
        await loadSessions();
        setSelectedSessionId(resolveSessionId(session));
        return session;
      } catch (error: any) {
        setAlert("Erro ao criar sessão: " + (error?.message || ""), "error");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadSessions, setAlert],
  );

  const refreshSession = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true);
        const session = await whatsappService.getWebSession(sessionId);
        setSessions((prev) => {
          const exists = prev.some((s) => resolveSessionId(s) === resolveSessionId(session));
          return exists
            ? prev.map((s) => (resolveSessionId(s) === resolveSessionId(session) ? session : s))
            : [...prev, session];
        });
        setSelectedSessionId(resolveSessionId(session));
        return session;
      } catch (error: any) {
        setAlert("Erro ao atualizar sessão: " + (error?.message || ""), "error");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setAlert],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true);
        await whatsappService.deleteWebSession(sessionId);
        setAlert("Sessão encerrada", "success");
        setSessions((prev) => prev.filter((s) => resolveSessionId(s) !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
        }
      } catch (error: any) {
        setAlert("Erro ao encerrar sessão: " + (error?.message || ""), "error");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedSessionId, setAlert],
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const selectedSession = useMemo(
    () => sessions.find((s) => resolveSessionId(s) === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  return {
    sessions,
    selectedSession,
    setSelectedSessionId,
    loading,
    loadSessions,
    refreshSessions: loadSessions, // Alias para compatibilidade
    createSession,
    refreshSession,
    deleteSession,
  };
}
