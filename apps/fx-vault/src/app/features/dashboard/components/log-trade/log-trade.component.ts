import { Component, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TradeStore } from '../../../../core/store/trade.store';
import { TRADE_UI_DICT } from '../../../../core/content/trade-ui.dict';
import { TradeRecord, TradeType } from '../../../../core/models/trade-record.model';

@Component({
  selector: 'app-log-trade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './log-trade.component.html',
  styleUrl: './log-trade.component.scss',
})
export class LogTradeComponent {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(TradeStore);
  readonly formDict = TRADE_UI_DICT.logTradeForm;

  readonly isOpen = input<boolean>(false);
  readonly tradeToEdit = input<TradeRecord | null>(null);
  readonly closeModal = output<void>();

  readonly form = this.fb.group({
    pair: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{3,10}$/)]],
    type: ['BUY' as TradeType, [Validators.required]],
    lotSize: [null as number | null, [Validators.required, Validators.min(0.01)]],
    openPrice: [null as number | null, [Validators.required, Validators.min(0.00001)]],
    closePrice: [null as number | null],
    profit: [null as number | null],
    strategy: ['Manual', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const trade = this.tradeToEdit();
      if (trade) {
        this.form.patchValue({
          pair: trade.pair,
          type: trade.type,
          lotSize: trade.lotSize,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice ?? null,
          profit: trade.profit ?? 0,
          strategy: trade.strategy,
        });
      } else {
        this.form.reset({
          type: 'BUY',
          strategy: 'Manual',
          profit: 0,
        });
      }
    });
  }

  submitTrade(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const tradeTarget = this.tradeToEdit();

    if (tradeTarget) {
      this.store.updateTrade(tradeTarget.id, {
        pair: (val.pair ?? '').toUpperCase().trim(),
        type: (val.type ?? 'BUY') as TradeType,
        lotSize: Number(val.lotSize),
        openPrice: Number(val.openPrice),
        closePrice: val.closePrice != null && val.closePrice !== null ? Number(val.closePrice) : undefined,
        profit: Number(val.profit ?? 0),
        strategy: val.strategy ?? 'Manual',
      });
    } else {
      this.store.addTrade({
        pair: (val.pair ?? '').toUpperCase().trim(),
        type: (val.type ?? 'BUY') as TradeType,
        lotSize: Number(val.lotSize),
        openPrice: Number(val.openPrice),
        closePrice: val.closePrice != null && val.closePrice !== null ? Number(val.closePrice) : undefined,
        strategy: val.strategy ?? 'Manual',
        openDate: Date.now(),
        profit: Number(val.profit ?? 0),
      });
    }

    this.form.reset({
      type: 'BUY',
      strategy: 'Manual',
    });
    this.closeModal.emit();
  }

  onCancel(): void {
    this.form.reset({
      type: 'BUY',
      strategy: 'Manual',
    });
    this.closeModal.emit();
  }
}
