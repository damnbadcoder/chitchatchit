# Chitchatchit - Team Responsibilities & Work Breakdown

Chitchatchit is a decentralized, off-grid, epidemic store-and-forward messaging application designed to operate over Bluetooth Low Energy (BLE) without internet, cellular connectivity, or central servers.

To ensure maximum development speed and zero blockers under tight deadlines, the project is divided into four decoupled roles separated by strict interface contracts.

---

### Dev 1: Native Mobile & Raw BLE Radio Pipe (Dumb Byte Pipe)
* **Streamlined Native Radio Tasks:**
  1. Build `modules/ble-mesh/ios/` using CoreBluetooth (`CBCentralManager`, `CBPeripheralManager`).
  2. Build `modules/ble-mesh/android/` using `BluetoothGattServer` and `BluetoothGattCallback`.
  3. Implement raw BLE GATT server advertising (Service UUID + 4-byte rotating tag) and Central scanning.
  4. Implement MTU auto-negotiation (requesting highest MTU up to 512 bytes on Android, auto on iOS).
  5. Expose raw byte I/O methods to JavaScript: `writeRaw(peerId, bytes)` and event `onRawData(peerId, bytes)`.
* **Zero-Dependency Testing:**
  - Build a bare-bones native loopback test that connects two physical phones and sends a 180-byte string across the characteristic every 2 seconds.
  - Verify stable connect, write, notify, and disconnect cycles without native GATT crashes.
* **Emergency Fallback:** 
  - Have Dev 1 build a simple local Wi-Fi / Multipeer / UDP broadcast bridge first, or use a high-level library like `react-native-ble-plx` for Milestone 1.

---

### Dev 2: Cryptography, Wire Protocol & Chunking Engine
* **Cryptography Tasks:**
  1. Identity key derivation (Ed25519/X25519 via HKDF) and secure hardware keystore integration (`expo-secure-store`).
  2. Implement XChaCha20-Poly1305 symmetric AEAD and Ed25519 inner signature authentication (signature inside ciphertext).
  3. Prekey Manager: Signed Prekey (SPK) hourly rotation ring, One-Time Prekey (OTK) pool (8–24 keys), in-band replenish wire encoding.
  4. Channel key derivation (`scrypt` / `Argon2id` with channel salt and binding).
  5. 60-digit safety numbers with rejection sampling (5,200 SHA-256 rounds).
  6. Standalone `TrustEngine`: memory-only delegation graph and $M$-of-$N$ emergency validator.
* **Wire Protocol & Chunking Tasks :**
  7. **34-byte Wire Envelope Framing (`src/lib/protocol.ts`)**: Binary serialization/deserialization of the 34-byte header (`Magic [0x50, 0x43]`, `Version`, `Type`, `EnvelopeID`, `Timestamp`, `TTL`, `HopCount`).
  8. **Bucket Padding**: Pad plaintext payloads to bucket sizes (`256, 512, 1024, 2048, 4096, 8192, 16384` bytes) and floor timestamps to 60-second boundaries.
  9. **Chunking & Reassembly Engine (`src/lib/chunker.ts`)**: Pure TypeScript chunker that splits envelopes larger than MTU into 8-byte framed chunks and reassembles incoming chunks with a 30s timeout sweep.
  10. **Tag Manager & Tie-Breaker**: Generate 4-byte CSPRNG advertising tags, manage 15-minute rotation timer, and execute lexicographical tie-break logic.
* **Zero-Dependency Testing:**
  - 100% Vitest/Jest unit test coverage.
  - Test chunking 30 KB payloads into 180-byte chunks and reassembling without loss.
  - Test Alice $\to$ Bob envelope sealing, trial decryption, and OTK destruction verification.
* **Emergency Fallback:** 
  - Dev 2 falls back to standard libsodium / `@noble/ciphers` `box()` (standard public-key authenticated encryption) and defers OTK forward secrecy to Milestone 4.

---

### Dev 3: Epidemic Gossip Engine & Relay Store (Pure Networking)
* **Tasks (Streamlined & Hyper-Focused):**
  1. Build the epidemic gossip state machine:
     - When connected: Fisher-Yates shuffle local envelope IDs and exchange `Inventory` envelope (max 200 IDs).
     - Receiving peer computes delta and sends `Request` envelope.
     - Serving peer sends matching `Sealed` envelopes with `hopCount + 1`.
  2. **Relay Persistence & Dedup**:
     - Maintain the store-and-forward relay cache (`envelopes` SQLite table).
     - Implement 3-tier bloom/dedup ledgers (`seen`, `seen_messages`).
  3. **Network Defenses & Rate Limiting**:
     - Track `servedToPeer` per handle to prevent battery-drain amplification attacks.
     - Enforce hard session cap (max 600 envelopes per peer session).
     - Hop clamping: clamp `maxHops` to 6.
* **Zero-Dependency Testing:**
  - Instantiate 3 in-memory instances of `MeshEngine` connected via a local mock `FakeTransport` (in-memory EventEmitter).
  - Simulate multi-hop epidemic sync: Node A sends to Node B; Node B walks to Node C; verify Node C receives the message without hardware.
* **Emergency Fallback:** 
  - Dev 3 keeps the store-and-forward relay queue in a plain in-memory JavaScript `Map` / `Set` for Milestone 1 and adds persistent SQLite in Milestone 2.

---

### Dev 4: UI/UX, Local Chat Store & App Lifecycle
* **UI & Navigation Tasks:**
  1. Build Expo Router screen hierarchy: `index` (conversations list), `chat/[id]`, `channels/join`, `contacts/add`, `verify/[id]`, `settings`.
  2. Build conversational security warning banners (`#public` red alert, `#channel` amber alert, `~group` green alert).
  3. Build safety number verification screen (display 12x 5-digit groups + QR scanner / QR generator).
  4. Build Panic Wipe UI: confirmation slider $\to$ triggers atomic wipe flow.
  5. **`RadioAccessGate.tsx` **: Screen/modal prompting user to turn on Bluetooth and grant OS permissions (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, Location).
  6. **`MeshRadarScreen.tsx` **: Visual radar showing discovered peers, live RSSI signals, and connection logs.
* **Local Data & Lifecycle Tasks :**
  7. **`BleTransport.ts` **: TypeScript wrapper around native radio events, handling listener cleanups and status callbacks.
  8. **Local Chat Database (`src/lib/store.ts`)**: Manage SQLite tables for `messages`, `contacts`, `channels`.
  9. **Fan-Out Groups & Recipient Tracking**: Manage `groups`, `group_members`, and `message_recipients` tables. Handle group fan-out dispatch (encrypting copies for each group member).
  10. **Delivery Receipts & Status Ticks**: Match incoming delivery receipts to message IDs and update UI status (`pending` $\to$ `relayed` $\to$ `delivered`).
  11. **6-Hour Message Sweeper**: Routine background interval (runs every 60s) purging local messages older than 6 hours (`first_seen < now - 6h`).
  12. **Panic Wipe Orchestration**: Execute the full purge sequence (wipe keystore seed, drop local SQLite tables, clear state, reset UI).
* **Zero-Dependency Testing:**
  - Implement a `MockMeshService` that returns hardcoded conversations, mock contacts, and responds with echo messages after 1.5 seconds.
  - Complete the entire frontend look, feel, animations, and flows without running SQLite or BLE.

---

## Tasks for First Milestone (Deadline: 11 Oct)

> **Milestone 1 Objective:** Two phones with **Airplane Mode ON** (Wi-Fi and Cellular disabled) discover each other over Bluetooth, connect, and exchange encrypted chat messages in real time.

### First Approach Tasks Per Developer:

| Developer | Scope for 11 Oct Milestone | Concrete First Approach Tasks | Demo Deliverable |
| :--- | :--- | :--- | :--- |
| **Dev 1 (Radio Pipe)** | Raw BLE Connection & Byte Transfer | 1. Implement BLE Central + Peripheral discovery and 1-to-1 connection in `modules/ble-mesh/`.<br>2. Transmit raw bytes (< 180 bytes) across characteristic without native crashes. | Two phones discover each other and transmit raw byte strings over BLE. |
| **Dev 2 (Crypto & Framing)** | Identity + Direct Encryption + 34B Header | 1. Implement `getOrCreateIdentity()` using `expo-secure-store` and Ed25519/X25519.<br>2. Implement `sealDirectMessage()` and `openDirectMessage()`.<br>3. Implement `packEnvelope()` and `unpackEnvelope()` in `src/lib/protocol.ts`. | Unit-tested pipeline: Text string $\to$ sealed & framed 34B binary envelope $\to$ unpack & decrypt back to verified text. |
| **Dev 3 (Mesh Gossip)** | Direct Envelope Dispatcher & Queue | 1. Create in-memory message queue and deduplication ledger (`seen: Set<string>`).<br>2. Bridge Dev 2's packed envelopes to Dev 1's `Transport.send()`.<br>3. Handle incoming raw envelope from `Transport.on('payload')`, verify envelope ID is not in `seen`, and deliver to Dev 4. | In-memory message dispatcher connecting radio transport to application layer without data loss. |
| **Dev 4 (UI & Local Store)** | Chat Screen + Permissions Gate + SQLite | 1. Build basic Chat screen (`chat/[id]`) with input field, send button, and message bubbles.<br>2. Build `RadioAccessGate.tsx` to handle Bluetooth permission prompts.<br>3. Setup local `expo-sqlite` database with `messages` table and save/load messages. | Working chat screen displaying sent/received messages loaded from SQLite with permission gating. |

---

### Step-by-Step 11 Oct Integration Flow

```text
[Alice's Phone]                                            [Bob's Phone]
========================================================================
1. Dev 4: RadioAccessGate verifies Bluetooth permissions & power
2. Dev 4: Alice types "Hello over mesh!" -> Saved to local SQLite
3. Dev 2: Alice's text sealed via XChaCha20 + 34B wire envelope framed
4. Dev 3: Envelope placed in queue and passed to transport
5. Dev 1: Transport transmits raw bytes over BLE ========================>
                                                           6. Dev 1: Receives raw bytes on Bob's phone
                                                           7. Dev 3: Dedup check (new envelope ID)
                                                           8. Dev 2: Unpacks 34B header & decrypts payload
                                                           9. Dev 4: Saves to SQLite & renders message bubble
```
