# AI Learnings, Debug Log & Pitfall Registry

This document records mistakes, command issues, bug resolutions, and edge cases encountered during development. It serves as a continuous learning registry for AI assistants and developers working on **fx-vault**.

---

## 📌 Logged Learnings & Lessons

### 1. Package Manager & Dependency Installation (`npm install`)
* **Issue**: Running plain `npm install` failed with `npm error Cannot read properties of null (reading 'children')` due to lockfile mismatches between `package-lock.json` and `bun.lock`.
* **Root Cause**: Npm 11 lockfile resolution bug when processing mixed lockfile artifacts.
* **Resolution / Rule**: Always run `npm install --legacy-peer-deps` when installing dependencies in this workspace.

---

### 2. Command Execution Guidelines (No `cd`)
* **Issue**: Changing directories via `cd path && command` in shell invocations causes state loss or execution errors across tools.
* **Resolution / Rule**: Never execute `cd`. Always specify the target directory explicitly using the `Cwd` parameter (e.g. `Cwd: "/home/jirehpadua/fx-vault"`).

---

### 3. Real-Time UI Signal Desync Across Devices
* **Issue**: When Firestore `onSnapshot` received remote trade updates on a second device, `FirebaseSyncService` saved the trade to Dexie (`IndexedDB`), but the UI (`TradeStore` signal) did not refresh.
* **Root Cause**: `FirebaseSyncService` wrote directly to IndexedDB without emitting an event to trigger `TradeStore.loadTrades()`.
* **Resolution / Rule**: Added `remoteChange$` Subject stream to `FirebaseSyncService` and subscribed `TradeStore` during `onInit`. Any background sync automatically triggers a reactive UI state reload.

---

### 4. Offline Conflict Overwrites & Timestamp Versioning
* **Issue**: Editing or syncing pending local trades without version tracking could blindly overwrite newer cloud edits or resurrect deleted items.
* **Root Cause**: Lack of modification timestamps on trade documents.
* **Resolution / Rule**: Added `updatedAt` Unix millisecond timestamp to `TradeRecord`. Before applying remote snapshot data or uploading pending local items, compare `updatedAt` timestamps—newer timestamps always take precedence.

---

## 📝 How to Log New AI Learnings
Whenever an error, command failure, or logical flaw is identified:
1. Document the **Issue**, **Root Cause**, and **Resolution / Rule** in this file ([`docs/ai_learnings.md`](file:///home/jirehpadua/fx-vault/docs/ai_learnings.md)).
2. Update [`docs/workflow.md`](file:///home/jirehpadua/fx-vault/docs/workflow.md) if the learning changes standard operating procedures.
3. User can also trigger the `/learn` slash command to persist key behavior rules across AI sessions.
