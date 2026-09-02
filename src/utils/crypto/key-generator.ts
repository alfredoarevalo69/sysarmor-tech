// src/utils/crypto/key-generator.ts

export interface KeyGeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export function generateSecureKey(options: KeyGeneratorOptions): string {
  let chars = '';
  if (options.useUpper) chars += UPPER;
  if (options.useLower) chars += LOWER;
  if (options.useNumbers) chars += NUMBERS;
  if (options.useSymbols) chars += SYMBOLS;

  if (!chars || options.length <= 0) {
    throw new Error('Debe seleccionar al menos un conjunto de caracteres y una longitud válida.');
  }

  const array = new Uint32Array(options.length);
  window.crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < options.length; i++) {
    result += chars[array[i] % chars.length];
  }

  return result;
}