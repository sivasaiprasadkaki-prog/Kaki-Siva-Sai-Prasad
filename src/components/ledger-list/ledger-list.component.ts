import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from '../../services/ledger.service';
import { Ledger } from '../../models';

@Component({
  selector: 'app-ledger-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ledger-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerListComponent {
  ledgerService = inject(LedgerService);
  searchTerm = input<string>('');

  isFormVisible = signal(false);
  editingLedger = signal<Ledger | null>(null);

  filteredLedgers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const ledgers = this.ledgerService.ledgers();
    if (!term) return ledgers;
    return ledgers.filter(ledger => ledger.name.toLowerCase().includes(term));
  });

  showAddForm() {
    this.editingLedger.set(null);
    this.isFormVisible.set(true);
  }

  showEditForm(ledger: Ledger) {
    this.editingLedger.set(ledger);
    this.isFormVisible.set(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
    this.editingLedger.set(null);
  }

  saveLedger(event: Event, nameInput: HTMLInputElement) {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    const ledgerToEdit = this.editingLedger();
    if (ledgerToEdit) {
      this.ledgerService.updateLedger(ledgerToEdit.id, name);
    } else {
      this.ledgerService.addLedger(name);
    }
    this.hideForm();
  }

  deleteLedger(id: string) {
    // Removing confirm dialog to ensure functionality in all environments.
    this.ledgerService.deleteLedger(id);
  }

  selectLedger(id: string) {
    this.ledgerService.selectLedger(id);
  }
}
