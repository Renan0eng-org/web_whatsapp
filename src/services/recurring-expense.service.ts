import api from "./api";

export async function getRecurringExpenses(params?: {
  isActive?: boolean;
  isPaid?: boolean;
}) {
  const response = await api.get('/financas/recurring-expenses', { params });
  return response.data;
}

export async function getRecurringExpenseById(id: string) {
  const response = await api.get(`/financas/recurring-expenses/${id}`);
  return response.data;
}

export async function getUpcomingExpenses(days?: number) {
  const response = await api.get('/financas/recurring-expenses/upcoming', {
    params: { days },
  });
  return response.data;
}

export async function getOverdueExpenses() {
  const response = await api.get('/financas/recurring-expenses/overdue');
  return response.data;
}

export async function createRecurringExpense(data: {
  name: string;
  description?: string;
  companyName?: string;
  categoryId?: string;
  qrCode?: string;
  dueDate: Date | string;
  amount: number;
  registrationDate?: Date | string;
  isRecurring?: boolean;
  recurringEndDate?: Date | string;
}) {
  const response = await api.post('/financas/recurring-expenses', data);
  return response.data;
}

export async function updateRecurringExpense(id: string, data: {
  name?: string;
  description?: string;
  companyName?: string;
  categoryId?: string;
  qrCode?: string;
  dueDate?: Date | string;
  amount?: number;
  isActive?: boolean;
  isPaid?: boolean;
  isRecurring?: boolean;
  recurringEndDate?: Date | string;
}) {
  const response = await api.put(`/financas/recurring-expenses/${id}`, data);
  return response.data;
}

export async function deleteRecurringExpense(id: string) {
  const response = await api.delete(`/financas/recurring-expenses/${id}`);
  return response.data;
}

export async function deleteRecurringExpenseGroup(id: string) {
  const response = await api.delete(`/financas/recurring-expenses/${id}/group`);
  return response.data;
}

export async function getRecurringExpenseGroup(id: string) {
  const response = await api.get(`/financas/recurring-expenses/${id}/group`);
  return response.data;
}

export async function markExpenseAsPaid(id: string, data?: {
  transactionId?: string;
  paidDate?: Date | string;
}) {
  const response = await api.put(`/financas/recurring-expenses/${id}/mark-paid`, data);
  return response.data;
}

export async function testNotification() {
  const response = await api.post('/financas/recurring-expenses/test-notification');
  return response.data;
}
