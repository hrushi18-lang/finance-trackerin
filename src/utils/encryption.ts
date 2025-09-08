/**
 * Data Encryption Utilities
 * Provides encryption for sensitive financial data at rest
 */

interface EncryptionOptions {
  algorithm?: string;
  keyLength?: number;
  iterations?: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  algorithm: string;
  keyLength: number;
  iterations: number;
}

class EncryptionService {
  private algorithm = 'AES-GCM';
  private keyLength = 256;
  private iterations = 100000;
  private keyDerivationAlgorithm = 'PBKDF2';

  constructor(options: EncryptionOptions = {}) {
    this.algorithm = options.algorithm || this.algorithm;
    this.keyLength = options.keyLength || this.keyLength;
    this.iterations = options.iterations || this.iterations;
  }

  /**
   * Generate a random encryption key
   */
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive key from password
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: this.keyDerivationAlgorithm },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: this.keyDerivationAlgorithm,
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate random salt
   */
  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate random IV
   */
  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Encrypt data
   */
  async encrypt(data: string, key: CryptoKey, iv?: Uint8Array): Promise<EncryptedData> {
    const ivToUse = iv || this.generateIV();
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: ivToUse
      },
      key,
      encodedData
    );

    return {
      data: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(ivToUse),
      salt: '', // Will be set by encryptWithPassword
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      iterations: this.iterations
    };
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const data = this.base64ToArrayBuffer(encryptedData.data);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Encrypt data with password
   */
  async encryptWithPassword(data: string, password: string): Promise<EncryptedData> {
    const salt = this.generateSalt();
    const key = await this.deriveKeyFromPassword(password, salt);
    const encrypted = await this.encrypt(data, key);

    return {
      ...encrypted,
      salt: this.arrayBufferToBase64(salt)
    };
  }

  /**
   * Decrypt data with password
   */
  async decryptWithPassword(encryptedData: EncryptedData, password: string): Promise<string> {
    const salt = this.base64ToArrayBuffer(encryptedData.salt);
    const key = await this.deriveKeyFromPassword(password, salt);
    return await this.decrypt(encryptedData, key);
  }

  /**
   * Encrypt sensitive financial data
   */
  async encryptFinancialData(data: any, password: string): Promise<EncryptedData> {
    const jsonData = JSON.stringify(data);
    return await this.encryptWithPassword(jsonData, password);
  }

  /**
   * Decrypt sensitive financial data
   */
  async decryptFinancialData(encryptedData: EncryptedData, password: string): Promise<any> {
    const jsonData = await this.decryptWithPassword(encryptedData, password);
    return JSON.parse(jsonData);
  }

  /**
   * Hash password for storage
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptObjectFields(
    obj: any,
    fieldsToEncrypt: string[],
    password: string
  ): Promise<any> {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const encryptedData = await this.encryptWithPassword(
          JSON.stringify(obj[field]),
          password
        );
        encrypted[field] = encryptedData;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptObjectFields(
    obj: any,
    fieldsToDecrypt: string[],
    password: string
  ): Promise<any> {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (obj[field] && typeof obj[field] === 'object' && obj[field].data) {
        try {
          const decryptedData = await this.decryptWithPassword(obj[field], password);
          decrypted[field] = JSON.parse(decryptedData);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          decrypted[field] = obj[field]; // Keep original if decryption fails
        }
      }
    }

    return decrypted;
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService();

// Export convenience functions
export const encryptData = (data: string, password: string) => encryptionService.encryptWithPassword(data, password);
export const decryptData = (encryptedData: EncryptedData, password: string) => encryptionService.decryptWithPassword(encryptedData, password);
export const encryptFinancialData = (data: any, password: string) => encryptionService.encryptFinancialData(data, password);
export const decryptFinancialData = (encryptedData: EncryptedData, password: string) => encryptionService.decryptFinancialData(encryptedData, password);
export const hashPassword = (password: string) => encryptionService.hashPassword(password);
export const verifyPassword = (password: string, hash: string) => encryptionService.verifyPassword(password, hash);
export const generateSecureRandom = (length?: number) => encryptionService.generateSecureRandom(length);
export const encryptObjectFields = (obj: any, fields: string[], password: string) => encryptionService.encryptObjectFields(obj, fields, password);
export const decryptObjectFields = (obj: any, fields: string[], password: string) => encryptionService.decryptObjectFields(obj, fields, password);

export default encryptionService;
