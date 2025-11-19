
export interface Attachment {
  name: string;
  type: string;
  dataUrl: string; // Base64 encoded string
}

export type ExpenseType = 'cash-in' | 'cash-out';

export interface Expense {
  id: string;
  type: ExpenseType;
  date: string;
  details: string;
  category: string;
  mode: string;
  attachments: Attachment[];
  amount: number;
}

export interface Ledger {
  id: string;
  name: string;
  createdAt: string;
  expenses: Expense[];
}
