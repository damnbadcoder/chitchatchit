
### Dev 1: Native Mobile & BLE Radio
* **Tasks:**
  1. Build `modules/ble-mesh/ios/` using CoreBluetooth (`CBCentralManager`, `CBPeripheralManager`).
  2. Build `modules/ble-mesh/android/` using `BluetoothGattServer` and `BluetoothGattCallback`.
  3. Implement native 8-byte framing and chunk reassembly with 32 KB ceiling and 30s timeout sweep.
  4. Implement 15-minute CSPRNG tag rotation in broadcast advertisements.
  5. Implement duplicate connection tie-breaker via tag comparison.
  6. Export `BleTransport` matching **Contract 1**.
* **Zero-Dependency Testing:**
  - Build a bare-bones test harness script (or minimal test view) that connects two physical phones and sends a 20 KB random byte stream every 5 seconds.
  - Assert that all 20 KB chunks arrive without bit rot or memory leaks.
  - **Emergency Fallback**: 
  - Have Dev 1 build a simple local Wi-Fi / Multipeer / UDP broadcast bridge  
     first, or use a high-level library like react-native-ble-plx for Milestone 1.


### Dev 2: Cryptography & Web of Trust
* **Tasks:**
  1. Key derivation (Ed25519/X25519 via HKDF) and secure hardware keystore integration (`expo-secure-store`).
  2. Implement XChaCha20-Poly1305 symmetric AEAD and Ed25519 inner signature authentication.
  3. Prekey Manager: Signed Prekey (SPK) hourly rotation ring, One-Time Prekey (OTK) pool (8–24 keys), in-band replenish wire encoding.
  4. Channel key derivation (`scrypt` / `Argon2id` with channel salt and binding).
  5. 60-digit safety numbers with rejection sampling (5,200 SHA-256 rounds).
  6. Standalone `TrustEngine`: memory-only delegation graph and $M$-of-$N$ emergency validator.
* **Zero-Dependency Testing:**
  - 100% Jest/Vitest unit test coverage.
  - Test Alice $\to$ Bob envelope sealing, trial decryption, and OTK destruction verification.
  - Test known cryptographic vectors for safety numbers and channel derivations.
- **Emergency Fllback:**
- Dev 2 falls back to standard libsodium / @noble/ciphers box() (standard  public-key authenticated encryption) and defers OTK forward secrecy to Milestone 4.

### Dev 3: Protocol Framing, SQLite Store & Epidemic Mesh
* **Tasks:**
  1. Implement binary serialization of the 34-byte envelope header and bucket padding (`256` to `16384` bytes).
  2. Setup `expo-sqlite` with WAL mode, foreign keys, and complete relational schema.
  3. Implement 6-hour local first-sight retention cleaner (runs every 60s) and atomic `wipeEverything()`.
  4. Build the epidemic state machine: `Inventory` exchange, delta computation, `Request` generation, serving capped envelopes, and anti-amplification rate limits.
  5. Three-tier deduplication (`seen_messages` ciphertext hash, envelope ID, plaintext content hash).
  6. Direct message delivery receipt gating (only reply to verified/added contacts).
* **Zero-Dependency Testing:**
  - Instantiate 3 in-memory instances of `MeshEngine` connected via a local mock `FakeTransport` (in-memory EventEmitter).
  - Simulate multi-hop epidemic sync: Node A sends to Node B; Node B walks to Node C; verify Node C receives the message without hardware.
  - **Emergency Fallback**: 
  - Dev 3 keeps the store-and-forward relay queue in a plain in-memory  
     JavaScript Map / Set for Milestone 1 and adds persistent SQLite in Milestone 2.


### Dev 4: UI, UX, Navigation & State Provider
* **Tasks:**
  1. Build Expo Router screen hierarchy: `index` (conversations), `chat/[id]`, `channels/join`, `contacts/add`, `verify/[id]`, `settings`.
  2. Build conversational security warning banners (`#public` red alert, `#channel` amber alert, `~group` green alert).
  3. Build safety number verification screen (display 12x 5-digit groups + QR scanner / QR generator).
  4. Radio & OS permission gate (Bluetooth enabled, location permissions, radio active state).
  5. Atomic Panic Button: confirmation slider $\to$ triggers `executePanicWipe()` $\to$ immediate navigation to reset state.
* **Zero-Dependency Testing:**
  - Implement a `MockMeshService` that returns hardcoded conversations, mock contacts, and responds with echo messages after 1.5 seconds.
  - Complete the entire frontend look, feel, animations, and flows without running SQLite or BLE.



## Tasks for first Milestone (11 0ct):
  Developer       | Task in Milestone 1                   | Demo Deliverable  
 -----------------|---------------------------------------|----------------------------------------  
  Dev 1 (Radio)   | Build basic BLE Central + Peripheral  | Two phones pair and transfer raw text  
                  | discovery. Establish a connection and | over BLE.  
                  | send a raw string (< 180 bytes)       |  
                  | across the characteristic.            |  
  Dev 2 (Crypto)  | Single Ed25519/X25519 identity        | Function: encrypt(text, remotePubKey)  
                  | generation + basic authenticated      | and decrypt().  
                  | encryption (XChaCha20-Poly1305 or     |  
                  | NaCl Box).                            |  
  Dev 3 (Systems) | Minimal SQLite table for messages     | Messages persist and reload on app  
                  | (id, text, timestamp, sender) and     | restart.  
                  | direct message dispatch.              |  
  Dev 4 (UI/UX)   | Single Chat screen + Peer Discovery   | Working UI showing discovered peers  
                  | list + "Airplane Mode" status         | and chat bubbles.  
                  | indicator.                            |

