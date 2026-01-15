import api from "./api";

export async function createLoan(data: any) {
  const response = await api.post('/emprestimos', data);
  return response.data;
}

export async function createLoanBatch(data: any) {
  const response = await api.post('/emprestimos/batch', data);
  return response.data;
}

export async function getLoans(isPaid?: boolean) {
  const params = isPaid !== undefined ? { isPaid } : undefined;
  const response = await api.get('/emprestimos', { params });
  return response.data;
}

export async function getLoanById(id: string) {
  const response = await api.get(`/emprestimos/${id}`);
  return response.data;
}

export async function updateLoan(id: string, data: any) {
  const response = await api.put(`/emprestimos/${id}`, data);
  return response.data;
}

export async function markAsPaid(id: string) {
  const response = await api.put(`/emprestimos/${id}/mark-as-paid`, {});
  return response.data;
}

export async function reversePayment(id: string) {
  const response = await api.put(`/emprestimos/${id}/reverse-payment`, {});
  return response.data;
}

export async function deleteLoan(id: string) {
  const response = await api.delete(`/emprestimos/${id}`);
  return response.data;
}

export async function getLoansSummary() {
  const response = await api.get('/emprestimos/summary');
  return response.data;
}

export async function getInterestEarnings() {
  const response = await api.get('/emprestimos/earnings/summary');
  return response.data;
}

// ============ JUROS RECORRENTES ============

export async function getPendingRecurringInterest() {
  const response = await api.get('/emprestimos/recurring-interest/pending');
  return response.data;
}

export async function getRecurringInterestSummary(monthsBack: number = 12) {
  const response = await api.get('/emprestimos/recurring-interest/summary', {
    params: { monthsBack },
  });
  return response.data;
}

export async function generateRecurringInterest(loanId: string, monthsAhead: number = 1) {
  const response = await api.post(`/emprestimos/${loanId}/recurring-interest/generate`, null, {
    params: { monthsAhead },
  });
  return response.data;
}

export async function payRecurringInterest(data: {
  loanId: string;
  referenceMonth: Date;
  amount?: number;
  transactionId?: string;
  notes?: string;
}) {
  const response = await api.post('/emprestimos/recurring-interest/pay', data);
  return response.data;
}

export async function reverseRecurringInterestPayment(paymentId: string) {
  const response = await api.put(`/emprestimos/recurring-interest/${paymentId}/reverse`);
  return response.data;
}

export async function updateRecurringInterestPayment(paymentId: string, data: {
  amount?: number;
  referenceMonth?: Date;
  notes?: string;
}) {
  const response = await api.put(`/emprestimos/recurring-interest/${paymentId}`, data);
  return response.data;
}

export async function deleteRecurringInterestPayment(paymentId: string) {
  const response = await api.delete(`/emprestimos/recurring-interest/${paymentId}`);
  return response.data;
}
