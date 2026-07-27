import { Component, inject, output } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { TradeStore } from '../../../../core/store/trade.store';
import { TRADE_UI_DICT } from '../../../../core/content/trade-ui.dict';
import { TradeRecord } from '../../../../core/models/trade-record.model';

@Component({
  selector: 'app-trade-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './trade-list.component.html',
  styleUrl: './trade-list.component.scss',
})
export class TradeListComponent {
  readonly store = inject(TradeStore);
  readonly dict = TRADE_UI_DICT;
  readonly editTrade = output<TradeRecord>();
}
