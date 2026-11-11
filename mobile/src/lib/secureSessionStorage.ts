import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as aesjs from 'aes-js';

/**
 * Session storage for Supabase Auth.
 *
 * SecureStore (Keychain / Android Keystore) is limited to ~2 KB per value, and a Supabase
 * session is larger. So a random AES-256 key per entry is kept in SecureStore and the
 * session itself is stored AES-CTR encrypted in AsyncStorage. Wiping the key (sign out)
 * makes the ciphertext unreadable.
 */
const KEY_PREFIX = 'rm-session-key-';
const DATA_PREFIX = 'rm-session-';

function secureKeyName(key: string) {
  // SecureStore keys may only contain alphanumerics, ".", "-" and "_".
  return KEY_PREFIX + key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = Crypto.getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(secureKeyName(key), aesjs.utils.hex.fromBytes(encryptionKey));
  return aesjs.utils.hex.fromBytes(encrypted);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const hexKey = await SecureStore.getItemAsync(secureKeyName(key));
  if (!hexKey) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(hexKey), new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(DATA_PREFIX + key);
    if (!encrypted) return null;
    try {
      return await decrypt(key, encrypted);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await encrypt(key, value);
    await AsyncStorage.setItem(DATA_PREFIX + key, encrypted);
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(DATA_PREFIX + key);
    await SecureStore.deleteItemAsync(secureKeyName(key));
  },
};
