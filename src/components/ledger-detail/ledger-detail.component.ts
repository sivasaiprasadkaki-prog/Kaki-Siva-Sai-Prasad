import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LedgerService } from '../../services/ledger.service';
import { Ledger, Expense, ExpenseType } from '../../models';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-ledger-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, ExpenseFormComponent],
  templateUrl: './ledger-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerDetailComponent {
  ledgerService = inject(LedgerService);
  exportService = inject(ExportService);

  ledger = input.required<Ledger>();
  
  isFormVisible = signal(false);
  editingExpense = signal<Expense | null>(null);
  formMode = signal<ExpenseType>('cash-out');

  expensesWithBalance = computed(() => {
    return this.ledgerService.getLedgerWithCalculatedBalance(this.ledger());
  });

  totals = computed(() => {
    const expenses = this.ledger().expenses;
    const cashIn = expenses.filter(e => e.type === 'cash-in').reduce((sum, e) => sum + e.amount, 0);
    const cashOut = expenses.filter(e => e.type === 'cash-out').reduce((sum, e) => sum + e.amount, 0);
    const balance = cashIn - cashOut;
    return { cashIn, cashOut, balance };
  });

  showForm(mode: ExpenseType, expense: Expense | null = null) {
    this.formMode.set(mode);
    this.editingExpense.set(expense);
    this.isFormVisible.set(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
    this.editingExpense.set(null);
  }

  saveExpense(expenseData: Omit<Expense, 'id'>) {
    const expenseToEdit = this.editingExpense();
    const currentLedger = this.ledger();
    if (expenseToEdit) {
      this.ledgerService.updateExpense(currentLedger.id, expenseToEdit.id, expenseData);
    } else {
      this.ledgerService.addExpense(currentLedger.id, expenseData);
    }
    this.hideForm();
  }

  deleteExpense(expenseId: string) {
    // Removing confirm dialog to ensure functionality in all environments.
    this.ledgerService.deleteExpense(this.ledger().id, expenseId);
  }
  
  exportToExcel() {
    this.exportService.exportToExcel(this.ledger(), this.expensesWithBalance());
  }
  
  exportToPdf() {
    this.exportService.exportToPdf(this.ledger(), this.expensesWithBalance());
  }

  goBack() {
    this.ledgerService.selectLedger(null);
  }
}
