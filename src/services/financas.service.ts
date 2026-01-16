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
    loanItems?: Array<{ amount: number; dueDate: Date | string; description?: string; notes?: string }>; 
    loanPayments?: Array<{ loanId: string; amount: number; notes?: string }>;
  },
) {
  const response = await api.put(
    `/financas/transactions/${id}/classify`,
    { categoryId, notes, createLoan: options?.createLoan, borrowerName: options?.borrowerName, loanItems: options?.loanItems, loanPayments: options?.loanPayments },
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
