import QrScanner from 'qr-scanner';
import { useCallback, useRef, useState } from 'react';

interface UseQrScannerReturn {
  isScanning: boolean;
  error: string | null;
  startScanning: (videoElement: HTMLVideoElement, onResult: (result: string) => void) => Promise<void>;
  stopScanning: () => void;
  hasCamera: boolean;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'requesting';
  requestPermission: () => Promise<boolean>;
}

export function useQrScanner(): UseQrScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
  const qrScannerRef = useRef<QrScanner | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setPermissionStatus('requesting');
      setError(null);

      // Verificar se navigator.mediaDevices está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Acesso à câmera não suportado neste navegador');
      }

      // Solicitar permissão explicitamente
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Parar o stream imediatamente - só queríamos a permissão
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setPermissionStatus('denied');
        setError('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
      } else {
        setPermissionStatus('denied');
        setError(`Erro ao acessar câmera: ${errorMessage}`);
      }
      
      return false;
    }
  }, []);

  const startScanning = useCallback(async (videoElement: HTMLVideoElement, onResult: (result: string) => void) => {
    try {
      setError(null);
      setIsScanning(true);

      // Verificar se há câmeras disponíveis primeiro
      const hasCamera = await QrScanner.hasCamera();
      setHasCamera(hasCamera);
      
      if (!hasCamera) {
        throw new Error('Nenhuma câmera encontrada no dispositivo');
      }

      // Se ainda não temos permissão, solicitar
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setIsScanning(false);
          return;
        }
      }

      // Criar nova instância do scanner
      const qrScanner = new QrScanner(
        videoElement,
        (result) => {
          onResult(result.data);
          qrScannerRef.current?.stop();
          setIsScanning(false);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Câmera traseira por padrão
          maxScansPerSecond: 5,
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar o scanner';
      setError(errorMessage);
      setIsScanning(false);
      console.error('Erro no QR Scanner:', err);
    }
  }, [permissionStatus, requestPermission]);

  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setError(null);
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    hasCamera,
    permissionStatus,
    requestPermission,
  };
}