import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FirebaseSyncService } from './core/sync/firebase-sync.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Inject FirebaseSyncService so background sync initializes immediately on boot
  private readonly syncService = inject(FirebaseSyncService);
  protected title = 'fx-vault';
}
