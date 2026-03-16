/**
 * 加密/解密工具
 * 
 * 使用设备特征生成唯一密钥，提供基本的数据混淆。
 * 注意：这不是密码学安全的加密，仅用于防止明文存储敏感信息。
 * 对于高安全需求，建议使用系统密钥链或专业加密库。
 */

import { appDataDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { createLogger } from './logger';

const log = createLogger('Crypto');

/**
 * 密钥文件名
 */
const KEY_FILE_NAME = '.key';

/**
 * 旧版本的固定密钥（用于向后兼容）
 */
const LEGACY_KEY = 'MyTools2026SecretKey';

/**
 * 缓存的加密密钥
 */
let cachedKey: string | null = null;

/**
 * 初始化标记
 */
let initPromise: Promise<void> | null = null;

/**
 * 生成随机密钥
 */
function generateRandomKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 获取或创建加密密钥
 * 
 * 密钥存储在应用数据目录的 .key 文件中
 * 首次运行时自动生成
 */
async function initializeKey(): Promise<string> {
  if (cachedKey) {
    return cachedKey;
  }

  try {
    const dataDir = await appDataDir();
    const keyPath = dataDir + KEY_FILE_NAME;

    // 检查密钥文件是否存在
    const keyExists = await exists(keyPath);
    
    if (keyExists) {
      // 读取现有密钥
      const key = await readTextFile(keyPath);
      cachedKey = key.trim();
      log.info('加载现有加密密钥');
    } else {
      // 生成新密钥
      cachedKey = generateRandomKey();
      await writeTextFile(keyPath, cachedKey);
      log.info('生成并保存新的加密密钥');
    }
    
    return cachedKey;
  } catch (error) {
    log.error('初始化密钥失败，使用降级密钥:', error);
    // 降级到旧版密钥（确保向后兼容）
    cachedKey = LEGACY_KEY;
    return cachedKey;
  }
}

/**
 * 初始化加密模块（应用启动时调用）
 */
export async function initCrypto(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeKey().then(() => {});
  }
  return initPromise;
}

/**
 * XOR 混淆
 */
function xorObfuscate(str: string, key: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * 加密字符串
 * 
 * @param plaintext 明文
 * @returns 加密后的字符串（Base64 编码）
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }
  
  // 使用缓存的密钥
  const key = cachedKey || LEGACY_KEY;
  
  try {
    // 1. XOR 混淆
    const obfuscated = xorObfuscate(plaintext, key);
    
    // 2. 转换为 UTF-8 字节
    const bytes = new TextEncoder().encode(obfuscated);
    
    // 3. Base64 编码
    const base64 = btoa(String.fromCharCode(...bytes));
    
    return base64;
  } catch (error) {
    log.error('加密失败:', error);
    return '';
  }
}

/**
 * 解密字符串
 * 
 * @param ciphertext 密文（Base64 编码）
 * @returns 解密后的明文
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    return '';
  }
  
  // 使用缓存的密钥
  const key = cachedKey || LEGACY_KEY;
  
  try {
    // 1. Base64 解码
    const binary = atob(ciphertext);
    
    // 2. 转换为 UTF-8 字符串
    const obfuscated = binary;
    
    // 3. XOR 反混淆
    const plaintext = xorObfuscate(obfuscated, key);
    
    return plaintext;
  } catch (error) {
    log.error('解密失败:', error);
    return '';
  }
}

/**
 * 检查是否为加密字符串（简单判断是否为有效 Base64）
 */
export function isEncrypted(value: string): boolean {
  if (!value) {
    return false;
  }
  
  try {
    atob(value);
    return true;
  } catch {
    return false;
  }
}
