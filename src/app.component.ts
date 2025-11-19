
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from './services/ledger.service';
import { LedgerListComponent } from './components/ledger-list/ledger-list.component';
import { LedgerDetailComponent } from './components/ledger-detail/ledger-detail.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LedgerListComponent, LedgerDetailComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  ledgerService = inject(LedgerService);
  themeService = inject(ThemeService);
  isSearchVisible = signal(false);
  searchTerm = signal('');

  selectedLedger = this.ledgerService.selectedLedger;

  toggleSearch(event?: MouseEvent) {
    if (event && (event.target as HTMLElement).closest('input')) {
        return;
    }
    this.isSearchVisible.update(v => !v);
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}
