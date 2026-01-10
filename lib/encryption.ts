import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
}

// Type assertion after validation
const validatedKey: string = ENCRYPTION_KEY

/**
 * Encrypt text using AES encryption
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, validatedKey).toString()
}

/**
 * Decrypt ciphertext using AES decryption
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, validatedKey)
  return bytes.toString(CryptoJS.enc.Utf8)
}
