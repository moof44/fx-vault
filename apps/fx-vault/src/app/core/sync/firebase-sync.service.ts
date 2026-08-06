import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, doc, setDoc, deleteDoc, collection, onSnapshot, getDocs, getDoc } from '@angular/fire/firestore';
import { Subject } from 'rxjs';
import { FxVaultDB } from '../database/fx-vault.db';
import { TradeRecord } from '../models/trade-record.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseSyncService {
  private readonly db = inject(FxVaultDB);
  private readonly firestore = inject(Firestore, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  public readonly isSyncing = signal<boolean>(false);
  public readonly isConnected = signal<boolean>(false);
  public readonly lastSyncedAt = signal<Date | null>(null);
  public readonly cloudTradeCount = signal<number>(0);
  public readonly syncStatusMessage = signal<string>('Initializing Firebase Firestore connection...');
  public readonly projectId = 'fx-vault';

  /** Observable stream emitted whenever remote Firestore changes update the local database */
  public readonly remoteChange$ = new Subject<void>();

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.firestore) {
        this.isConnected.set(true);
        this.syncStatusMessage.set('Firestore Database connected');
        // Initial sync and setup live subscription
        this.initSyncEngine();
      } else {
        this.syncStatusMessage.set('Firestore offline / local mode');
      }
    }
  }

  private async initSyncEngine(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) {
      return;
    }

    try {
      // 1. Initial push of any pending local trades
      await this.syncPendingTrades();

      // 2. Set up real-time Firestore listener for remote updates
      const tradesColRef = collection(this.firestore, 'trades');
      
      this.unsubscribeSnapshot = onSnapshot(
        tradesColRef,
        async (snapshot) => {
          this.cloudTradeCount.set(snapshot.size);
          let hasLocalChanges = false;
          
          for (const change of snapshot.docChanges()) {
            const data = change.doc.data() as TradeRecord;
            if (change.type === 'added' || change.type === 'modified') {
              if (data && data.id) {
                const localExisting = await this.db.trades.get(data.id);
                // If local record has pending unsynced edits that are NEWER than the cloud doc, skip remote overwrite
                if (
                  localExisting &&
                  localExisting.syncStatus === 'LOCAL' &&
                  (localExisting.updatedAt || 0) > (data.updatedAt || 0)
                ) {
                  continue;
                }

                // Upsert to local Dexie database
                await this.db.trades.put({
                  ...data,
                  syncStatus: 'SYNCED',
                });
                hasLocalChanges = true;
              }
            } else if (change.type === 'removed') {
              if (change.doc.id) {
                await this.db.trades.delete(change.doc.id);
                hasLocalChanges = true;
              }
            }
          }

          this.lastSyncedAt.set(new Date());
          this.syncStatusMessage.set('Synced with Cloud Firestore');

          if (hasLocalChanges) {
            this.remoteChange$.next();
          }
        },
        (err) => {
          console.warn('[FirebaseSync] Firestore snapshot error:', err);
          this.syncStatusMessage.set(`Firestore Sync error: ${err.message}`);
        }
      );

      // 3. Periodic sync for pending local items every 15 seconds
      setInterval(() => {
        this.syncPendingTrades();
      }, 15000);
    } catch (err: unknown) {
      console.warn('[FirebaseSync] Failed to initialize Firestore sync engine:', err);
      const msg = err instanceof Error ? err.message : 'Unknown sync error';
      this.syncStatusMessage.set(`Sync engine error: ${msg}`);
    }
  }

  public async triggerSync(): Promise<void> {
    this.syncStatusMessage.set('Syncing with Firestore...');
    await this.syncPendingTrades();
    if (this.firestore) {
      try {
        const tradesColRef = collection(this.firestore, 'trades');
        const snap = await getDocs(tradesColRef);
        this.cloudTradeCount.set(snap.size);
        this.lastSyncedAt.set(new Date());
        this.syncStatusMessage.set('Firestore sync complete');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Sync check failed';
        this.syncStatusMessage.set(`Sync completed with warnings: ${msg}`);
      }
    }
  }

  public async syncPendingTrades(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) {
      return;
    }

    this.isSyncing.set(true);
    let resolvedRemoteUpdate = false;

    try {
      const pendingTrades = await this.db.trades
        .where('syncStatus')
        .equals('LOCAL')
        .toArray();

      if (pendingTrades.length === 0) {
        this.isSyncing.set(false);
        return;
      }

      for (const trade of pendingTrades) {
        try {
          await this.db.trades.update(trade.id, { syncStatus: 'SYNCING' });

          const tradeDocRef = doc(this.firestore, 'trades', trade.id);

          // Conflict resolution: check if remote document is newer
          const remoteSnap = await getDoc(tradeDocRef);
          if (remoteSnap.exists()) {
            const remoteData = remoteSnap.data() as TradeRecord;
            if ((remoteData.updatedAt || 0) > (trade.updatedAt || 0)) {
              // Cloud document is newer than local edit: adopt cloud data
              await this.db.trades.put({
                ...remoteData,
                syncStatus: 'SYNCED',
              });
              resolvedRemoteUpdate = true;
              continue;
            }
          }

          const now = Date.now();
          const payload: TradeRecord = {
            ...trade,
            updatedAt: trade.updatedAt || now,
            syncStatus: 'SYNCED',
          };
          await setDoc(tradeDocRef, payload);
          await this.db.trades.update(trade.id, { ...payload, syncStatus: 'SYNCED' });
        } catch (itemErr: unknown) {
          console.warn(`[FirebaseSync] Failed to sync trade ID ${trade.id}:`, itemErr);
          await this.db.trades.update(trade.id, { syncStatus: 'LOCAL' });
        }
      }

      if (resolvedRemoteUpdate) {
        this.remoteChange$.next();
      }

      this.lastSyncedAt.set(new Date());
      this.syncStatusMessage.set('Pending trades successfully synced to Firestore');
    } catch (err: unknown) {
      console.warn('[FirebaseSync] Sync pending trades error:', err);
    } finally {
      this.isSyncing.set(false);
    }
  }

  public async deleteTradeFromCloud(tradeId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) {
      return;
    }
    try {
      const tradeDocRef = doc(this.firestore, 'trades', tradeId);
      await deleteDoc(tradeDocRef);
      console.log(`[FirebaseSync] Deleted trade ${tradeId} from Firestore.`);
    } catch (err) {
      console.warn(`[FirebaseSync] Failed to delete trade ${tradeId} from Firestore:`, err);
    }
  }

  public destroy(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  }
}
