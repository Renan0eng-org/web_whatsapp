import { ExpenseCategory, Transaction } from './financas.types';

export interface LoanPayment {
  idPayment: string;
  loanId: string;
  transactionId: string;
  transaction?: Transaction;
  amount: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Loan {
  idLoan: string;
  userId: string;
  borrowerName: string;
  amount: number;
  categoryId?: string;
  category?: ExpenseCategory;
  transactionId?: string;
  dueDate: string | Date;
  description?: string;
  isPaid: boolean;
  paidDate?: string | Date;
  notes?: string;
  payments?: LoanPayment[];
  totalPaid?: number;
  remainingBalance?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LoanSummary {
  totalLoaned: number;
  totalPaid: number;
  totalLoans: number;
  paidLoans: number;
  overdueLoans: Loan[];
  upcomingPayments: Loan[];
  overdueAmount?: number;
  overdueCount?: number;
  upcomingAmount7Days?: number;
  unlinkedAmount?: number;
  unlinkedCount?: number;
  byCategory?: Record<string, number>;
}
