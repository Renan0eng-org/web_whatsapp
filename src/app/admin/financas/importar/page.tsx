'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { importCsv } from '@/services/financas.service';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ImportarPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewFile(selectedFile);
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const preview = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const row: { [key: string]: string } = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        preview.push(row);
      }
      setPreviewData(preview);
      setCurrentPage(0);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Selecione um arquivo CSV' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await importCsv(file);
      setMessage({
        type: 'success',
        text: result.message || `${result.imported} transações importadas com sucesso`,
      });
      setFile(null);
      setPreviewData(null);

      // Aguarda um pouco antes de redirecionar
      setTimeout(() => {
        router.push('/admin/financas/classificar');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Erro ao importar arquivo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-6 p-2 sm:p-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Importar Extrato Bancário</h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          Importe suas transações a partir de um arquivo CSV
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Selecionar Arquivo</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              O arquivo deve conter as colunas: Data (DD/MM/YYYY), Valor, Descrição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-2 sm:p-6 pt-0 sm:pt-0">
            <div className="relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center hover:bg-accent/50 transition cursor-pointer">
              <FileUp className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <p className="text-xs sm:text-sm font-medium">
                  Clique para selecionar ou arraste um arquivo CSV
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all px-2">
                  {file?.name || 'Nenhum arquivo selecionado'}
                </p>
              </label>
            </div>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                )}
                <AlertDescription className="text-xs sm:text-sm">{message.text}</AlertDescription>
              </Alert>
            )}

            {previewData && previewData.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm sm:text-base">
                    Prévia dos dados ({previewData.length} registros):
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Página {currentPage + 1} de {Math.ceil(previewData.length / itemsPerPage)}
                  </span>
                </div>
                <div className="space-y-3">
                  {previewData
                    .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                    .map((row, idx) => (
                      <div
                        key={currentPage * itemsPerPage + idx}
                        className="border rounded-lg p-2 bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            #{currentPage * itemsPerPage + idx + 1}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(row).map(([key, value]) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
                                {key}:
                              </span>
                              <span className="text-sm break-all">
                                {String(value).substring(0, 50) || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
                {previewData.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="hidden sm:flex items-center gap-1">
                      {/* pega 2 paginas para tras e 2 para frente da atual */}
                      {Array.from({ length: Math.ceil(previewData.length / itemsPerPage) })
                        .map((_, i) => i)
                        .filter((i) => i >= currentPage - 2 && i <= currentPage + 2)
                        .map((pageIndex) => (
                          <Button
                            key={pageIndex}
                            variant={currentPage === pageIndex ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageIndex)}
                            className="w-8 h-8 p-0"
                          >
                            {pageIndex + 1}
                          </Button>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(Math.ceil(previewData.length / itemsPerPage) - 1, p + 1)
                        )
                      }
                      disabled={currentPage >= Math.ceil(previewData.length / itemsPerPage) - 1}
                      className="flex-1 sm:flex-none"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full"
              size="lg"
            >
              {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Importando...' : 'Importar Transações'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Formato do CSV</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground text-xs sm:text-sm">
                Seu arquivo CSV deve ter o seguinte formato:
              </p>
              <div className="bg-muted p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-3">
                <pre className="whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal font-mono">{`Data,Valor,Identificador,Descrição
02/01/2026,320.00,695831c6-4ea5-4464-a13c-75e06e68c9d9,Transferência recebida
03/01/2026,-46.99,69594085-13ec-4d1a-a0de-4299d4244642,Compra no débito`}</pre>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li><strong>Data:</strong> Formato DD/MM/YYYY</li>
                <li><strong>Valor:</strong> Positivo para entrada, negativo para saída</li>
                <li><strong>Identificador:</strong> ID único (opcional)</li>
                <li><strong>Descrição:</strong> Detalhes da transação</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
