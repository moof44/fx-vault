import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeStore } from '../../core/store/trade.store';
import { TRADE_UI_DICT, ErrorDictMessage } from '../../core/content/trade-ui.dict';
import { TradeRecord } from '../../core/models/trade-record.model';
import { LogTradeComponent } from './components/log-trade/log-trade.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { TradeListComponent } from './components/trade-list/trade-list.component';
import { TradeFilterComponent } from './components/trade-filter/trade-filter.component';
import { EquityCurveComponent } from './components/equity-curve/equity-curve.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LogTradeComponent,
    SummaryCardsComponent,
    TradeListComponent,
    TradeFilterComponent,
    EquityCurveComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  host: {
    class: 'block w-full h-full',
  },
})
export class DashboardComponent {
  readonly store = inject(TradeStore);
  readonly dict = TRADE_UI_DICT;
  readonly isLogTradeModalOpen = signal(false);
  readonly selectedTrade = signal<TradeRecord | null>(null);

  readonly activeError = computed<ErrorDictMessage | null>(() => {
    const errCode = this.store.error();
    if (!errCode) return null;
    return this.dict.errors[errCode] || this.dict.errors['DEFAULT'];
  });

  openLogTradeModal(): void {
    this.selectedTrade.set(null);
    this.isLogTradeModalOpen.set(true);
  }

  openEditModal(trade: TradeRecord): void {
    this.selectedTrade.set(trade);
    this.isLogTradeModalOpen.set(true);
  }

  closeLogTradeModal(): void {
    this.isLogTradeModalOpen.set(false);
    this.selectedTrade.set(null);
  }
}
