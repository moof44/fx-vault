import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { FxVaultDB } from '../database/fx-vault.db';

@Injectable({
  providedIn: 'root',
})
export class FirebaseSyncService {
  private readonly db = inject(FxVaultDB);
  private readonly firestore = inject(Firestore, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    // Poll for pending local trades every 15 seconds if running in browser
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.syncPendingTrades();
      }, 15000);
    }
  }

  async syncPendingTrades(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Find all trade records locally that have not been synced yet
      const pendingTrades = await this.db.trades
        .where('syncStatus')
        .equals('LOCAL')
        .toArray();

      if (pendingTrades.length === 0) {
        return;
      }

      if (!this.firestore) {
        console.warn(
          '[FirebaseSync] Firestore is not configured yet. Pending trades will remain stored locally.'
        );
        return;
      }

      for (const trade of pendingTrades) {
        try {
          // Temporarily mark status as SYNCING in Dexie
          await this.db.trades.update(trade.id, { syncStatus: 'SYNCING' });

          // Push record to Firestore 'trades' collection
          const tradeDocRef = doc(this.firestore, 'trades', trade.id);
          const payload = {
            ...trade,
            syncStatus: 'SYNCED',
          };
          await setDoc(tradeDocRef, payload);

          // On success, update Dexie record's syncStatus to SYNCED
          await this.db.trades.update(trade.id, { syncStatus: 'SYNCED' });
        } catch (itemErr: unknown) {
          console.warn(
            `[FirebaseSync] Failed to sync trade ID ${trade.id}. Retrying next cycle.`,
            itemErr
          );
          // Reset status back to LOCAL so next retry cycle picks it up
          await this.db.trades.update(trade.id, { syncStatus: 'LOCAL' });
        }
      }
    } catch (err: unknown) {
      console.warn('[FirebaseSync] Background sync cycle encountered an error:', err);
    }
  }
}
