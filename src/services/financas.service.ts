import api from "./api";


// ===== CATEGORIES =====


export async function getCategories() {
  const response = await api.get('/financas/categories');
  return response.data;
}

export async function createCategory(data: any) {
  const response = await api.post('/financas/categories', data);
  return response.data;
}

export async function updateCategory(id: string, data: any) {
  const response = await api.put(`/financas/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: string) {
  const response = await api.delete(`/financas/categories/${id}`);
  return response.data;
}

// ===== TRANSACTIONS =====

export async function getTransactions(params?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  isClassified?: boolean;
  search?: string;
  minValue?: number;
  maxValue?: number;
  type?: 'income' | 'expense' | 'all';
}) {
  const response = await api.get('/financas/transactions', { params });
  return response.data;
}

export async function getTransactionById(id: string) {
  const response = await api.get(`/financas/transactions/${id}`);
  return response.data;
}

export async function createTransaction(data: any) {
  const response = await api.post('/financas/transactions', data);
  return response.data;
}

export async function classifyTransaction(
  id: string,
  categoryId: string,
  notes?: string,
  options?: { 
    createLoan?: boolean; 
    borrowerName?: string; 
    loanItems?: Array<{ 
      amount: number; 
      categoryId: string;
      dueDate: Date | string; 
      description?: string; 
      notes?: string;
      interestRate?: number;
      interestType?: 'SIMPLE' | 'COMPOUND';
      periodRule?: 'MENSAL' | 'ANUAL';
      expectedProfit?: number;
      isRecurringInterest?: boolean;
      recurringInterestDay?: number;
      createdAt?: Date | string;
    }>; 
    loanPayments?: Array<{ loanId: string; amount: number; notes?: string }>;
  },
) {
  const response = await api.put(
    `/financas/transactions/${id}/classify`,
    { 
      categoryId, 
      notes, 
      createLoan: options?.createLoan, 
      borrowerName: options?.borrowerName, 
      loanItems: options?.loanItems, 
      loanPayments: options?.loanPayments 
    },
  );
  return response.data;
}

export async function getPaidLoans() {
  const response = await api.get('/financas/paid-loans');
  return response.data;
}

export async function deleteTransaction(id: string) {
  const response = await api.delete(`/financas/transactions/${id}`);
  return response.data;
}

export async function unclassifyTransaction(id: string) {
  const response = await api.put(`/financas/transactions/${id}/unclassify`, {});
  return response.data;
}

// ===== TRASH (LIXEIRA) =====

export async function getDeletedTransactions() {
  const response = await api.get('/financas/trash');
  return response.data;
}

export async function restoreTransaction(id: string) {
  const response = await api.put(`/financas/trash/${id}/restore`, {});
  return response.data;
}

export async function permanentDeleteTransaction(id: string) {
  const response = await api.delete(`/financas/trash/${id}`);
  return response.data;
}

// ===== IMPORT CSV =====

export async function importCsv(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/financas/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getImportHistory() {
  const response = await api.get('/financas/import-csv/history');
  return response.data;
}

export async function revertImportBatch(batchId: string) {
  const response = await api.post(`/financas/import-csv/${batchId}/revert`, {});
  return response.data;
}

function getFileNameFromContentDisposition(contentDisposition?: string, fallback = 'arquivo.csv') {
  if (!contentDisposition) return fallback;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (simpleMatch?.[1]) return simpleMatch[1];
  return fallback;
}

function triggerBlobDownload(data: BlobPart, fileName: string, mimeType?: string) {
  const blob = new Blob([data], { type: mimeType || 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadImportedCsv(batchId: string) {
  const response = await api.get(`/financas/import-csv/${batchId}/download`, {
    responseType: 'blob',
  });

  const fileName = getFileNameFromContentDisposition(
    response.headers['content-disposition'],
    `importacao_${batchId}.csv`,
  );

  triggerBlobDownload(response.data, fileName, response.data?.type);
}

export async function downloadCsvTemplate() {
  const response = await api.get('/financas/import-csv/template', {
    responseType: 'blob',
  });

  const fileName = getFileNameFromContentDisposition(
    response.headers['content-disposition'],
    'modelo_importacao_financas.csv',
  );

  triggerBlobDownload(response.data, fileName, response.data?.type);
}

// ===== STATISTICS =====

export async function getFinancialSummary(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.get('/financas/summary', { params });
  return response.data;
}

export async function getFinancialSeries(params: {
  startDate: string;
  endDate: string;
}): Promise<Array<{ date: string; income: number; expenses: number; balance: number; unpaid: number }>> {
  const response = await api.get('/financas/series', { params });
  return response.data;
}
