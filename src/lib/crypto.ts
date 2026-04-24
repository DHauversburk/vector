import { logger } from './logger'

/**
 * Client-side encryption (AES-GCM 256) for data-at-rest in the offline queue
 * and local caches. Uses the native Web Crypto API.
 *
 * Key lifecycle: a non-extractable AES-GCM symmetric key is generated on first
 * use and stored in origin-bound IndexedDB. It cannot be exported by scripts.
 */

const ENCRYPTION_DB_NAME = 'vector_keystore'
const STORE_NAME = 'keys'
const KEY_NAME = 'tactical_vault_key'

// Chunk size chosen well below all engines' argument-list limit (~65K in V8)
// while still being large enough to minimize string concatenation overhead.
const BASE64_CHUNK_SIZE = 0x8000 // 32 KiB

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }
  return btoa(binary)
}

async function getCryptoKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ENCRYPTION_DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Generates or retrieves the non-extractable AES-GCM key.
 */
async function getAesKey(): Promise<CryptoKey> {
  const db = await getCryptoKeyStore()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(KEY_NAME)

    request.onsuccess = async () => {
      if (request.result) {
        resolve(request.result)
      } else {
        // Generate a new AES-GCM 256 key
        const newKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false, // Cannot be extracted!
          ['encrypt', 'decrypt'],
        )

        // Store the key
        const putReq = store.put(newKey, KEY_NAME)
        putReq.onsuccess = () => resolve(newKey)
        putReq.onerror = () => reject(putReq.error)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Encrypts a JSON object into a Base64 string for safe local storage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing; tracked by P2 epic
export async function encryptPayload(data: any): Promise<string> {
  try {
    const key = await getAesKey()
    const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV

    const encoder = new TextEncoder()
    const encodedData = encoder.encode(JSON.stringify(data))

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData,
    )

    // Concatenate IV and Ciphertext
    const ciphertext = new Uint8Array(encryptedBuffer)
    const payload = new Uint8Array(iv.length + ciphertext.length)
    payload.set(iv, 0)
    payload.set(ciphertext, iv.length)

    // Convert to Base64. NOTE: `btoa(String.fromCharCode(...payload))` blows the
    // JS argument stack for payloads larger than ~32 KB (engine-dependent).
    // Chunked apply keeps the argument list small so large mock stores and
    // offline queues encrypt safely.
    return bytesToBase64(payload)
  } catch (error) {
    logger.error('crypto', 'Encryption failed', error)
    throw new Error('Encryption Engine Failure')
  }
}

/**
 * Decrypts a Base64 string back into a JSON object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing; tracked by P2 epic
export async function decryptPayload(base64Payload: string | any): Promise<any> {
  if (!base64Payload || typeof base64Payload !== 'string') return base64Payload // Not encrypted

  try {
    const key = await getAesKey()

    // Convert from Base64
    const binaryString = atob(base64Payload)
    const payload = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      payload[i] = binaryString.charCodeAt(i)
    }

    // Extract IV and Ciphertext
    const iv = payload.slice(0, 12)
    const ciphertext = payload.slice(12)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    )

    const decoder = new TextDecoder()
    const jsonString = decoder.decode(decryptedBuffer)
    return JSON.parse(jsonString)
  } catch (error) {
    logger.error('crypto', 'Decryption failed', error)
    // Might fail if the key was wiped or data is corrupted
    throw new Error('Decryption Engine Failure')
  }
}
