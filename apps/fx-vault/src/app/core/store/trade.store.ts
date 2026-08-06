import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { FxVaultDB } from '../database/fx-vault.db';
import { TradeRecord } from '../models/trade-record.model';
import { FirebaseSyncService } from '../sync/firebase-sync.service';

export interface TradeState {
  trades: TradeRecord[];
  isLoading: boolean;
  error: string | null;
  filterStrategy: string;
  filterPair: string;
}

const initialState: TradeState = {
  trades: [],
  isLoading: false,
  error: null,
  filterStrategy: 'All',
  filterPair: 'All',
};

export const TradeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ trades, filterStrategy, filterPair }) => ({
    availableStrategies: computed<string[]>(() => {
      const set = new Set(trades().map((t) => t.strategy).filter(Boolean));
      return Array.from(set).sort();
    }),

    availablePairs: computed<string[]>(() => {
      const set = new Set(trades().map((t) => t.pair).filter(Boolean));
      return Array.from(set).sort();
    }),

    filteredTrades: computed<TradeRecord[]>(() => {
      const list = trades();
      const strat = filterStrategy();
      const pair = filterPair();

      return list.filter((t) => {
        const matchesStrategy = strat === 'All' || t.strategy === strat;
        const matchesPair = pair === 'All' || t.pair === pair;
        return matchesStrategy && matchesPair;
      });
    }),
  })),
  withMethods((store) => {
    const db = inject(FxVaultDB);
    const platformId = inject(PLATFORM_ID);
    const syncService = inject(FirebaseSyncService);

    return {
      setStrategyFilter(strategy: string) {
        patchState(store, { filterStrategy: strategy });
      },

      setPairFilter(pair: string) {
        patchState(store, { filterPair: pair });
      },

      async loadTrades() {
        if (!isPlatformBrowser(platformId)) {
          return;
        }

        patchState(store, { isLoading: true, error: null });
        try {
          const trades = await db.trades.orderBy('openDate').reverse().toArray();
          patchState(store, { trades, isLoading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'FAILED_TO_LOAD_TRADES';
          patchState(store, {
            error: message,
            isLoading: false,
          });
        }
      },

      async addTrade(trade: Omit<TradeRecord, 'id' | 'syncStatus'>) {
        if (!isPlatformBrowser(platformId)) {
          return;
        }

        patchState(store, { isLoading: true, error: null });
        try {
          const id = crypto.randomUUID();
          const now = Date.now();
          const newTrade: TradeRecord = {
            ...trade,
            id,
            syncStatus: 'LOCAL',
            updatedAt: now,
          };
          await db.trades.add(newTrade);
          // Reload trades to update local state
          const trades = await db.trades.orderBy('openDate').reverse().toArray();
          patchState(store, { trades, isLoading: false });
          // Trigger Firestore sync
          syncService.syncPendingTrades();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'FAILED_TO_ADD_TRADE';
          patchState(store, {
            error: message,
            isLoading: false,
          });
        }
      },

      async updateTrade(id: string, changes: Partial<TradeRecord>) {
        if (!isPlatformBrowser(platformId)) {
          return;
        }

        patchState(store, { isLoading: true, error: null });
        try {
          const now = Date.now();
          await db.trades.update(id, { ...changes, syncStatus: 'LOCAL', updatedAt: now });
          const trades = await db.trades.orderBy('openDate').reverse().toArray();
          patchState(store, { trades, isLoading: false });
          syncService.syncPendingTrades();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'FAILED_TO_UPDATE_TRADE';
          patchState(store, {
            error: message,
            isLoading: false,
          });
        }
      },

      async deleteTrade(id: string) {
        if (!isPlatformBrowser(platformId)) {
          return;
        }

        patchState(store, { isLoading: true, error: null });
        try {
          await db.trades.delete(id);
          const trades = await db.trades.orderBy('openDate').reverse().toArray();
          patchState(store, { trades, isLoading: false });
          syncService.deleteTradeFromCloud(id);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'FAILED_TO_DELETE_TRADE';
          patchState(store, {
            error: message,
            isLoading: false,
          });
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.loadTrades();
      const syncService = inject(FirebaseSyncService);
      syncService.remoteChange$.subscribe(() => {
        store.loadTrades();
      });
    },
  })
);

