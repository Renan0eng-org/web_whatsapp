export interface ExpenseCategory {
  idCategory: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  type: 'ALIMENTACAO' | 'TRANSPORTE' | 'UTILIDADES' | 'SAUDE' | 'EDUCACAO' | 'LAZER' | 'TELEFONE' | 'INTERNET' | 'SEGUROS' | 'IMPOSTOS' | 'RENDA' | 'INVESTIMENTOS' | 'OUTRAS';
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  idTransaction: string;
  userId: string;
  date: string;
  value: number;
  description: string;
  externalId?: string;
  categoryId?: string;
  category?: ExpenseCategory;
  isClassified: boolean;
  aiSuggestion?: string;
  notes?: string;
  metadata?: Record<string, any>;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Record<string, number>;
  totalTransactions: number;
  classifiedCount: number;
  unclassifiedCount: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  message: string;
}
