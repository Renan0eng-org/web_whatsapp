import { ExpenseCategory } from './financas.types';

export interface RecurringExpense {
  idRecurringExpense: string;
  userId: string;
  name: string;
  description?: string;
  companyName?: string;
  categoryId?: string;
  category?: ExpenseCategory;
  qrCode?: string;
  dueDate: string | Date;
  amount: number;
  registrationDate: string | Date;
  isActive: boolean;
  isPaid: boolean;
  paidDate?: string | Date;
  transactionId?: string;
  recurringGroupId?: string;
  isMainExpense: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface RecurringExpenseFormData {
  name: string;
  description: string;
  companyName: string;
  categoryId: string;
  qrCode: string;
  dueDate: string;
  amount: string;
  registrationDate: string;
}
