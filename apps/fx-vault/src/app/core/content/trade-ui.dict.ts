export interface ErrorDictMessage {
  title: string;
  message: string;
}

export const TRADE_UI_DICT = {
  headers: {
    dashboardTitle: 'Trading Journal',
    dashboardSubtitle: 'Track, analyze, and optimize your forex execution history.',
    tradesOverview: 'Recorded Executions',
  },
  emptyState: {
    title: 'No Trades Logged',
    message: 'Your journal is empty. Log a trade to see your performance metrics and execution history.',
    actionText: 'Log Your First Trade',
  },
  logTradeForm: {
    title: 'Log New Trade',
    editTitle: 'Edit / Close Trade',
    labels: {
      pair: 'Currency Pair',
      type: 'Order Type',
      lotSize: 'Lot Size',
      openPrice: 'Open Price',
      closePrice: 'Close Price',
      profit: 'Profit / Loss ($)',
      strategy: 'Strategy',
    },
    placeholders: {
      pair: 'e.g., EURUSD',
      lotSize: '0.01',
      openPrice: '1.1050',
      closePrice: 'e.g., 1.1120',
      profit: 'e.g., 150.00',
    },
    buttons: {
      cancel: 'Cancel',
      submit: 'Save Trade',
      update: 'Update Trade',
    },
    strategies: ['Manual', 'Grid-EA', 'Martingale', 'Scalping'],
  },
  filters: {
    strategyLabel: 'Strategy',
    pairLabel: 'Currency Pair',
    allOption: 'All',
  },
  charts: {
    equityTitle: 'Equity Curve',
  },
  labels: {
    pair: 'Pair',
    type: 'Type',
    lotSize: 'Lot Size',
    openPrice: 'Open Price',
    closePrice: 'Close Price',
    profit: 'Profit / Loss',
    strategy: 'Strategy',
    openDate: 'Open Date',
    status: 'Sync Status',
    magicNumber: 'Magic No.',
    ticketId: 'Ticket ID',
  },
  errors: {
    DB_READ_ERROR: {
      title: 'Local Storage Error',
      message: 'We could not load your trades from the browser storage.',
    },
    FAILED_TO_LOAD_TRADES: {
      title: 'Database Read Failure',
      message: 'Unable to retrieve trade records from local IndexedDB.',
    },
    FAILED_TO_ADD_TRADE: {
      title: 'Save Execution Failure',
      message: 'Failed to record the trade in local database storage.',
    },
    FAILED_TO_UPDATE_TRADE: {
      title: 'Update Record Failure',
      message: 'Failed to update trade record details in local database.',
    },
    FAILED_TO_DELETE_TRADE: {
      title: 'Deletion Failure',
      message: 'Failed to delete trade record from local database.',
    },
    DEFAULT: {
      title: 'Unexpected Application Error',
      message: 'An unexpected error occurred while managing your trading journal.',
    },
  } as Record<string, ErrorDictMessage>,
} as const;
