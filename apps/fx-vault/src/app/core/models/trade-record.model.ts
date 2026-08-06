export type TradeType = 'BUY' | 'SELL';
export type SyncStatus = 'LOCAL' | 'SYNCING' | 'SYNCED';

export interface TradeRecord {
  id: string; // Internal UUID primary key
  ticketId?: string; // Broker's ticket number
  magicNumber?: number; // For EA tracking
  pair: string; // e.g., 'EURUSD'
  type: TradeType;
  lotSize: number;
  openPrice: number;
  closePrice?: number;
  openDate: number; // Unix timestamp for fast querying
  closeDate?: number;
  profit: number; // PnL in account currency
  strategy: string; // e.g., 'Manual', 'Grid-EA', 'Martingale'
  syncStatus: SyncStatus;
  updatedAt?: number; // Unix timestamp for conflict resolution
}
