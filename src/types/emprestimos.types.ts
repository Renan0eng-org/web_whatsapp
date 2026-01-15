import { ExpenseCategory, Transaction } from './financas.types';

export type InterestType = 'SIMPLE' | 'COMPOUND';
export type PeriodRule = 'MENSAL' | 'ANUAL';

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

export interface RecurringInterestPayment {
  idPayment: string;
  loanId: string;
  referenceMonth: string | Date;
  amount: number;
  isPaid: boolean;
  paidDate?: string | Date;
  transactionId?: string;
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
  interestRate?: number;
  interestType?: InterestType;
  periodRule?: PeriodRule;
  marketReference?: number;
  expectedProfit?: number;
  isRecurringInterest?: boolean;
  recurringInterestDay?: number;
  payments?: LoanPayment[];
  recurringPayments?: RecurringInterestPayment[];
  totalPaid?: number;
  remainingBalance?: number;
  recurringInterestPaid?: number;
  recurringInterestPending?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InterestEarnings {
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  byType: {
    simple: { interest: number; amount: number };
    compound: { interest: number; amount: number };
  };
  recurringInterestPaid?: number;
  recurringInterestPending?: number;
  totalRecurringInterest?: number;
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
  interestEarnings?: InterestEarnings;
}

export interface RecurringInterestSummary {
  [monthKey: string]: {
    paid: number;
    pending: number;
    details: {
      loanId: string;
      borrowerName: string;
      amount: number;
      isPaid: boolean;
      paidDate?: string | Date;
    }[];
  };
}
