'use client';

import { WhatsAppConfig, whatsappService } from '@/services/whatsapp.service';
import { useCallback, useEffect, useState } from 'react';
import { useAlert } from './use-alert';

export function useWhatsAppConfig() {
    const [configs, setConfigs] = useState<WhatsAppConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<WhatsAppConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const { setAlert } = useAlert();

    const loadConfigs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await whatsappService.getConfigs();
            setConfigs(data);
        } catch (error: any) {
            setAlert('Erro ao carregar configurações: ' + (error.message || ''), 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const createConfig = useCallback(
        async (data: Parameters<typeof whatsappService.createConfig>[0]) => {
            try {
                setLoading(true);
                const result = await whatsappService.createConfig(data);
                setAlert('Configuração criada com sucesso', 'success');
                await loadConfigs();
                return result;
            } catch (error: any) {
                setAlert('Erro ao criar configuração: ' + (error.message || ''), 'error');
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [loadConfigs],
    );

    const updateConfig = useCallback(
        async (
            configId: string,
            data: Parameters<typeof whatsappService.updateConfig>[1],
        ) => {
            try {
                setLoading(true);
                const result = await whatsappService.updateConfig(configId, data);
                setAlert('Configuração atualizada com sucesso', 'success');
                await loadConfigs();
                return result;
            } catch (error: any) {
                setAlert('Erro ao atualizar configuração: ' + (error.message || ''), 'error');
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [loadConfigs],
    );

    const deleteConfig = useCallback(
        async (configId: string) => {
            try {
                setLoading(true);
                const result = await whatsappService.deleteConfig(configId);
                setAlert('Configuração removida com sucesso', 'success');
                await loadConfigs();
                return result;
            } catch (error: any) {
                setAlert('Erro ao remover configuração: ' + (error.message || ''), 'error');
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [loadConfigs],
    );

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    return {
        configs,
        selectedConfig,
        setSelectedConfig,
        loading,
        loadConfigs,
        createConfig,
        updateConfig,
        deleteConfig,
    };
}
