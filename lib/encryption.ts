import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// Validate key lazily (only when encryption/decryption is actually used)
// This allows the app to build without the key set
function getValidatedKey(): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
  }
  return ENCRYPTION_KEY
}

/**
 * Encrypt text using AES encryption
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getValidatedKey()).toString()
}

/**
 * Decrypt ciphertext using AES decryption
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getValidatedKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}
