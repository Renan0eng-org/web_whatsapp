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
