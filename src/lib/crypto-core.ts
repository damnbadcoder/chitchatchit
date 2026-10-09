import * as SecureStore from 'expo-secure-store';

export interface IdentityKeyPair {
    seed: Uint8Array;
    edPublic: Uint8Array;
    edSecret: Uint8Array;
    xPublic: Uint8Array;
    xSecret: Uint8Array;
    publicId: string;
}

export interface DecryptedDirectMessage {
    senderPublicId: string;
    senderEdPublic: Uint8Array;
    body: string;
}

export async function getOrCreateIdentity() : Promise<IdentityKeyPair> {
    let seedHex = await SecureStore.getItemAsync(SEED_STORAGE_KEY);
    let seed: Uint8Array;

    if (seedHex) {
        seed = Uint8Array.from(ArrayBuffer.from(seedHex, 'hex'));
    }
}