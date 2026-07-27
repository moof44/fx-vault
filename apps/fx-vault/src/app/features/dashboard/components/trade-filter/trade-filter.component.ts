import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeStore } from '../../../../core/store/trade.store';
import { TRADE_UI_DICT } from '../../../../core/content/trade-ui.dict';

@Component({
  selector: 'app-trade-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-filter.component.html',
  styleUrl: './trade-filter.component.scss',
})
export class TradeFilterComponent {
  readonly store = inject(TradeStore);
  readonly filtersDict = TRADE_UI_DICT.filters;

  onStrategyChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.store.setStrategyFilter(target.value);
    }
  }

  onPairChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.store.setPairFilter(target.value);
    }
  }
}
