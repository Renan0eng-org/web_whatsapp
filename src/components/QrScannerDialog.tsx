'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useQrScanner } from '@/hooks/use-qr-scanner';
import { Camera, Shield, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (result: string) => void;
}

export function QrScannerDialog({ open, onOpenChange, onResult }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isScanning, error, startScanning, stopScanning, hasCamera, permissionStatus, requestPermission } = useQrScanner();

  useEffect(() => {
    if (open && videoRef.current && hasCamera && permissionStatus === 'granted') {
      startScanning(videoRef.current, (result) => {
        onResult(result);
        onOpenChange(false);
      });
    }

    return () => {
      if (isScanning) {
        stopScanning();
      }
    };
  }, [open, hasCamera, permissionStatus, startScanning, stopScanning, isScanning, onResult, onOpenChange]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted && videoRef.current && hasCamera) {
      startScanning(videoRef.current, (result) => {
        onResult(result);
        onOpenChange(false);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear QR Code
          </DialogTitle>
          <DialogDescription>
            Posicione o QR Code dentro da área destacada para escaneá-lo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasCamera && (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma câmera encontrada no dispositivo
              </p>
            </div>
          )}

          {hasCamera && permissionStatus === 'unknown' && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                É necessário permitir acesso à câmera para escanear QR codes
              </p>
              <Button onClick={handleRequestPermission} className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permitir Acesso à Câmera
              </Button>
            </div>
          )}

          {hasCamera && permissionStatus === 'requesting' && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-blue-500 mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Solicitando permissão para acessar a câmera...
              </p>
            </div>
          )}

          {hasCamera && permissionStatus === 'denied' && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-red-500 mb-2" />
              <p className="text-sm text-red-600 mb-4">
                Acesso à câmera negado. Verifique as configurações do seu navegador.
              </p>
              <Button variant="outline" onClick={handleRequestPermission}>
                Tentar Novamente
              </Button>
            </div>
          )}

          {hasCamera && permissionStatus === 'granted' && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                playsInline
                muted
              />
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg animate-pulse" />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 Mantenha o QR Code bem iluminado e dentro do quadro para melhor leitura
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}