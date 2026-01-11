import { ExpenseCategory } from './financas.types';

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
}
