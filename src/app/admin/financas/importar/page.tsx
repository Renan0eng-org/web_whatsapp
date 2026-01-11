'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { importCsv } from '@/services/financas.service';
import { AlertCircle, CheckCircle2, FileUp, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ImportarPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

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
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',');
        const row: { [key: string]: string } = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || '';
        });
        preview.push(row);
      }
      setPreviewData(preview);
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Extrato Bancário</h1>
        <p className="text-muted-foreground mt-2">
          Importe suas transações a partir de um arquivo CSV
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Arquivo</CardTitle>
            <CardDescription>
              O arquivo deve conter as colunas: Data (DD/MM/YYYY), Valor, Descrição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition">
              <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <p className="text-sm font-medium">
                  Clique para selecionar ou arraste um arquivo CSV
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file?.name || 'Nenhum arquivo selecionado'}
                </p>
              </label>
            </div>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {previewData && previewData.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Prévia dos dados:</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {Object.keys(previewData[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {Object.values(row).map((value: any, cidx) => (
                            <td key={cidx} className="px-4 py-2">
                              {String(value).substring(0, 50)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
          <CardHeader>
            <CardTitle>Formato do CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Seu arquivo CSV deve ter o seguinte formato:
              </p>
              <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                <pre>{`Data,Valor,Identificador,Descrição
02/01/2026,320.00,695831c6-4ea5-4464-a13c-75e06e68c9d9,Transferência recebida
03/01/2026,-46.99,69594085-13ec-4d1a-a0de-4299d4244642,Compra no débito`}</pre>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
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
