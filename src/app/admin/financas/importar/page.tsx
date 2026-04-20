'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    downloadCsvTemplate,
    downloadImportedCsv,
    getImportHistory,
    importCsv,
    revertImportBatch,
} from '@/services/financas.service';
import { ImportHistoryItem } from '@/types/financas.types';
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    FileClock,
    FileUp,
    Loader,
    RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function ImportarPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
    const [history, setHistory] = useState<ImportHistoryItem[]>([]);
    const [historyPage, setHistoryPage] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [busyBatchId, setBusyBatchId] = useState<string | null>(null);
  const itemsPerPage = 5;
    const historyItemsPerPage = 5;

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const result = await getImportHistory();
            const historyData = result || [];
            setHistory(historyData);
            setHistoryPage(0);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar historico de importacoes' });
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewFile(selectedFile);
    }
  };

    const previewFile = (fileToPreview: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());

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
        reader.readAsText(fileToPreview);
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadCsvTemplate();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erro ao baixar modelo CSV',
            });
        }
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
          text: result.message || `${result.imported} transacoes importadas com sucesso`,
      });
      setFile(null);
      setPreviewData(null);
        await loadHistory();

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

    const handleRevert = async (batchId: string) => {
        try {
            setBusyBatchId(batchId);
            const result = await revertImportBatch(batchId);
            setMessage({
                type: 'success',
                text: result.message || 'Importacao revertida com sucesso',
            });
            await loadHistory();
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erro ao reverter importacao',
            });
        } finally {
            setBusyBatchId(null);
        }
    };

    const handleDownloadImportedFile = async (batchId: string) => {
        try {
            setBusyBatchId(batchId);
            await downloadImportedCsv(batchId);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erro ao baixar arquivo importado',
            });
        } finally {
            setBusyBatchId(null);
        }
    };

    const pagedPreview = useMemo(() => {
        if (!previewData) return [];
        return previewData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    }, [previewData, currentPage]);

    const totalHistoryPages = useMemo(() => {
        if (!history.length) return 1;
        return Math.ceil(history.length / historyItemsPerPage);
    }, [history.length]);

    const pagedHistory = useMemo(() => {
        return history.slice(
            historyPage * historyItemsPerPage,
            (historyPage + 1) * historyItemsPerPage,
        );
    }, [history, historyPage]);

  return (
    <div className="space-y-2 sm:space-y-6 p-2 sm:p-6 max-w-full overflow-x-hidden">
          <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Importar Extrato Bancario</h1>
                  <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                      Importe suas transacoes a partir de um arquivo CSV
                  </p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
              </Button>
          </div>

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Selecionar Arquivo</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
                          O arquivo deve conter as colunas: Data (DD/MM/YYYY), Valor, Descricao
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
                                      Previa dos dados ({previewData.length} registros):
                  </h3>
                  <span className="text-xs text-muted-foreground">
                                      Pagina {currentPage + 1} de {Math.ceil(previewData.length / itemsPerPage)}
                  </span>
                </div>
                <div className="space-y-3">
                                  {pagedPreview.map((row, idx) => (
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
                            Math.min(Math.ceil(previewData.length / itemsPerPage) - 1, p + 1),
                        )
                      }
                      disabled={currentPage >= Math.ceil(previewData.length / itemsPerPage) - 1}
                      className="flex-1 sm:flex-none"
                    >
                                          Proximo
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
                          {loading ? 'Importando...' : 'Importar Transacoes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Formato do CSV</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                          Use o botao Baixar Modelo CSV para obter um arquivo pronto para preencher.
                      </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground text-xs sm:text-sm">
                Seu arquivo CSV deve ter o seguinte formato:
              </p>
              <div className="bg-muted p-2 sm:p-3 rounded text-[10px] sm:text-xs overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-3">
                              <pre className="whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal font-mono">{`Data,Valor,Identificador,Descricao
02/01/2026,320.00,695831c6-4ea5-4464-a13c-75e06e68c9d9,Transferencia recebida
03/01/2026,-46.99,69594085-13ec-4d1a-a0de-4299d4244642,Compra no debito`}</pre>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm">
                <li><strong>Data:</strong> Formato DD/MM/YYYY</li>
                              <li><strong>Valor:</strong> Positivo para entrada, negativo para saida</li>
                              <li><strong>Identificador:</strong> ID unico (opcional)</li>
                              <li><strong>Descricao:</strong> Detalhes da transacao</li>
              </ul>
            </div>
          </CardContent>
        </Card>

              <Card>
                  <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <FileClock className="h-4 w-4" />
                          Historico de Importacoes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                          Baixe arquivos antigos, reverta importacoes e reimporte quando necessario.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                      {loadingHistory ? (
                          <div className="flex justify-center py-8">
                              <Loader className="h-6 w-6 animate-spin" />
                          </div>
                      ) : history.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8 text-sm">
                              Nenhuma importacao registrada ainda.
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2 px-1">
                                  <span className="text-xs text-muted-foreground">
                                      Pagina {historyPage + 1} de {totalHistoryPages}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                      {history.length} registro(s)
                                  </span>
                              </div>

                              {pagedHistory.map((item) => (
                                  <div key={item.idImportBatch} className="border rounded-lg p-3 sm:p-4 space-y-3">
                                      <div className="flex items-start justify-between gap-3 flex-wrap">
                                          <div>
                                              <p className="font-medium break-all">{item.importedFile.originalName}</p>
                                              <p className="text-xs text-muted-foreground mt-1">
                                                  {new Date(item.createdAt).toLocaleString('pt-BR')} | {(item.importedFile.fileSize / 1024).toFixed(1)} KB
                                              </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <Badge variant={item.status === 'REVERTED' ? 'destructive' : 'default'}>
                                                  {item.status === 'REVERTED' ? 'Revertida' : item.batchType === 'REIMPORT' ? 'Reimportacao' : 'Importacao'}
                                              </Badge>
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                                          <div className="bg-muted rounded px-2 py-1">Importadas: {item.importedCount}</div>
                                          <div className="bg-muted rounded px-2 py-1">Restauradas: {item.restoredFromTrashCount}</div>
                                          <div className="bg-muted rounded px-2 py-1">Ignoradas: {item.skippedCount}</div>
                                          <div className="bg-muted rounded px-2 py-1">Lixeira: {item.movedToTrashCount}</div>
                                          <div className="bg-muted rounded px-2 py-1">Removidas: {item.deletedCount}</div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap">
                                          <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleDownloadImportedFile(item.idImportBatch)}
                                              disabled={busyBatchId === item.idImportBatch}
                                          >
                                              {busyBatchId === item.idImportBatch ? (
                                                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                                              ) : (
                                                  <Download className="h-4 w-4 mr-2" />
                                              )}
                                              Baixar CSV
                                          </Button>

                                          {item.status !== 'REVERTED' && (
                                              <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() => handleRevert(item.idImportBatch)}
                                                  disabled={busyBatchId === item.idImportBatch}
                                              >
                                                  {busyBatchId === item.idImportBatch ? (
                                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                                  ) : (
                                                      <RotateCcw className="h-4 w-4 mr-2" />
                                                  )}
                                                  Reverter Importacao
                                              </Button>
                                          )}
                                      </div>
                                  </div>
                              ))}

                              {totalHistoryPages > 1 && (
                                  <div className="flex items-center justify-between mt-4 gap-2">
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                                          disabled={historyPage === 0}
                                          className="flex-1 sm:flex-none"
                                      >
                                          <ChevronLeft className="h-4 w-4 mr-1" />
                                          Anterior
                                      </Button>

                                      <div className="hidden sm:flex items-center gap-1">
                                          {Array.from({ length: totalHistoryPages })
                                              .map((_, i) => i)
                                              .filter((i) => i >= historyPage - 2 && i <= historyPage + 2)
                                              .map((pageIndex) => (
                                                  <Button
                                                      key={pageIndex}
                                                      variant={historyPage === pageIndex ? 'default' : 'outline'}
                                                      size="sm"
                                                      onClick={() => setHistoryPage(pageIndex)}
                                                      className="w-8 h-8 p-0"
                                                  >
                                                      {pageIndex + 1}
                                                  </Button>
                                              ))}
                                      </div>

                                      <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages - 1, p + 1))}
                                          disabled={historyPage >= totalHistoryPages - 1}
                                          className="flex-1 sm:flex-none"
                                      >
                                          Proximo
                                          <ChevronRight className="h-4 w-4 ml-1" />
                                      </Button>
                                  </div>
                              )}
                          </div>
                      )}
                  </CardContent>
              </Card>
      </div>
    </div>
  );
}
