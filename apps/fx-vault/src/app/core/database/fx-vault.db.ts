import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { TradeRecord } from '../models/trade-record.model';

@Injectable({ providedIn: 'root' })
export class FxVaultDB extends Dexie {
  trades!: Table<TradeRecord, string>;

  constructor() {
    super('FxVaultDB');
    this.version(1).stores({
      trades: 'id, pair, openDate, strategy, syncStatus',
    });
  }
}

export const db = new FxVaultDB();
