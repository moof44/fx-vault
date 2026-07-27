# Implementation Plan - Edit/Close Trade Modal & Full CRUD Lifecycle

This plan covers extending the `LogTradeComponent` into a dual-purpose **Log / Edit Trade Modal**, enabling users to edit or close open trades directly from the dashboard list.

## User Review Required

> [!IMPORTANT]
> - **Content Dictionary**: Add `editTitle: 'Edit / Close Trade'` and `updateButton: 'Update Trade'` to `TRADE_UI_DICT.logTradeForm`.
> - **Modal Refactoring**: Form controls for `closePrice` and `profit` with automatic `effect()` value patching when `tradeToEdit` is provided.
> - **Trade List Row Interaction**: Interactive `cursor-pointer` trade rows emitting `editTrade` events.
> - **Dashboard Integration**: `selectedTrade` signal state managing edit target vs new trade creation.

## Proposed Changes

### Core Content Dictionary

#### [MODIFY] [trade-ui.dict.ts](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/core/content/trade-ui.dict.ts)
*   Add `editTitle` and `updateButton` to `logTradeForm`.

### Log Trade Component (Dual-Purpose Modal)

#### [MODIFY] [log-trade.component.ts](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/components/log-trade/log-trade.component.ts)
*   Add `@Input() tradeToEdit` signal input (`input<TradeRecord | null>(null)`).
*   Add `closePrice` and `profit` controls to `FormGroup`.
*   Add `effect()` watching `tradeToEdit()` to patch or reset form values.
*   Update `submitTrade()` to dispatch `updateTrade()` when editing or `addTrade()` when creating.

#### [MODIFY] [log-trade.component.html](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/components/log-trade/log-trade.component.html)
*   Dynamic title rendering (`tradeToEdit() ? formDict.editTitle : formDict.title`).
*   Dynamic submit button text.
*   Include inputs for `closePrice` and `profit`.

### Trade List Component

#### [MODIFY] [trade-list.component.ts](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/components/trade-list/trade-list.component.ts)
*   Add `readonly editTrade = output<TradeRecord>();`.

#### [MODIFY] [trade-list.component.html](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/components/trade-list/trade-list.component.html)
*   Add `(click)="editTrade.emit(trade)"` and `cursor-pointer` styling to trade rows.

### Dashboard Integration

#### [MODIFY] [dashboard.component.ts](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/dashboard.component.ts)
*   Add `selectedTrade = signal<TradeRecord | null>(null)`.
*   Add `openEditModal(trade: TradeRecord)`.
*   Reset `selectedTrade` in `openLogTradeModal()`.

#### [MODIFY] [dashboard.component.html](file:///C:/Personal/Projects/fx-vault/apps/fx-vault/src/app/features/dashboard/dashboard.component.html)
*   Bind `(editTrade)="openEditModal($event)"` on `<app-trade-list>`.
*   Pass `[tradeToEdit]="selectedTrade()"` into `<app-log-trade>`.

## Verification Plan

### Automated Checks
*   Run `npx nx lint fx-vault` to ensure no linting or accessibility errors.
