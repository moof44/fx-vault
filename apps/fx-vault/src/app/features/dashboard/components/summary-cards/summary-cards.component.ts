import { Component, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { TradeStore } from '../../../../core/store/trade.store';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PercentPipe],
  templateUrl: './summary-cards.component.html',
  styleUrl: './summary-cards.component.scss',
})
export class SummaryCardsComponent {
  readonly store = inject(TradeStore);

  readonly totalTrades = computed<number>(() => this.store.filteredTrades().length);

  readonly winRate = computed<number>(() => {
    const trades = this.store.filteredTrades();
    if (trades.length === 0) {
      return 0;
    }
    const winningTrades = trades.filter((t) => t.profit > 0).length;
    return winningTrades / trades.length;
  });

  readonly totalPnL = computed<number>(() => {
    return this.store.filteredTrades().reduce((sum, t) => sum + (t.profit || 0), 0);
  });
}
