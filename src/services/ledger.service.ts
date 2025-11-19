
import { Injectable, signal, computed, effect } from '@angular/core';
import { Ledger, Expense, ExpenseType } from '../models';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly STORAGE_KEY = 'trip-tracker-ledgers';
  
  ledgers = signal<Ledger[]>([]);
  selectedLedgerId = signal<string | null>(null);

  selectedLedger = computed(() => {
    const id = this.selectedLedgerId();
    const ledgers = this.ledgers();
    return ledgers.find(l => l.id === id) ?? null;
  });

  constructor() {
    const storedLedgers = localStorage.getItem(this.STORAGE_KEY);
    if (storedLedgers) {
      this.ledgers.set(JSON.parse(storedLedgers));
    }
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.ledgers()));
    });
  }

  selectLedger(id: string | null) {
    this.selectedLedgerId.set(id);
  }

  // Ledger Methods
  addLedger(name: string) {
    const newLedger: Ledger = {
      id: self.crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      expenses: []
    };
    this.ledgers.update(ledgers => [...ledgers, newLedger]);
  }

  updateLedger(id: string, name: string) {
    this.ledgers.update(ledgers =>
      ledgers.map(l => l.id === id ? { ...l, name } : l)
    );
  }

  deleteLedger(id: string) {
    this.ledgers.update(ledgers => ledgers.filter(l => l.id !== id));
    if (this.selectedLedgerId() === id) {
      this.selectLedger(null);
    }
  }

  // Expense Methods
  addExpense(ledgerId: string, expenseData: Omit<Expense, 'id'>) {
    const newExpense: Expense = { ...expenseData, id: self.crypto.randomUUID() };
    this.ledgers.update(ledgers =>
      ledgers.map(l =>
        l.id === ledgerId ? { ...l, expenses: [newExpense, ...l.expenses] } : l
      )
    );
  }

  updateExpense(ledgerId: string, expenseId: string, expenseData: Omit<Expense, 'id'>) {
    this.ledgers.update(ledgers =>
      ledgers.map(l => {
        if (l.id === ledgerId) {
          const updatedExpenses = l.expenses.map(e =>
            e.id === expenseId ? { ...expenseData, id: expenseId } : e
          );
          return { ...l, expenses: updatedExpenses };
        }
        return l;
      })
    );
  }

  deleteExpense(ledgerId: string, expenseId: string) {
    this.ledgers.update(ledgers =>
      ledgers.map(l => {
        if (l.id === ledgerId) {
          return { ...l, expenses: l.expenses.filter(e => e.id !== expenseId) };
        }
        return l;
      })
    );
  }

  // Calculated Properties
  getLedgerWithCalculatedBalance(ledger: Ledger | null): (Expense & { balance: number })[] {
    if (!ledger) return [];
    
    let runningBalance = 0;
    const expensesWithBalance: (Expense & { balance: number })[] = [];
    
    // Process in reverse for correct chronological balance
    for (let i = ledger.expenses.length - 1; i >= 0; i--) {
        const expense = ledger.expenses[i];
        if (expense.type === 'cash-in') {
            runningBalance += expense.amount;
        } else {
            runningBalance -= expense.amount;
        }
    }
    
    // Now calculate balance for display order (newest first)
    for (const expense of ledger.expenses) {
      expensesWithBalance.push({ ...expense, balance: runningBalance });
      if (expense.type === 'cash-in') {
        runningBalance -= expense.amount;
      } else {
        runningBalance += expense.amount;
      }
    }
    
    return expensesWithBalance;
  }
}
