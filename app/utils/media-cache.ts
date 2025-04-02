import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

const CACHE_DIR = join(process.cwd(), '.cache', 'whatsapp-media');

interface CachedMedia {
  mimeType: string;
  data: Buffer;
}

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await access(CACHE_DIR, constants.F_OK);
  } catch {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}

// Get cache file path for a message ID
function getCacheFilePath(messageId: string): string {
  return join(CACHE_DIR, `${messageId}.json`);
}

// Check if media is cached
export async function isMediaCached(messageId: string): Promise<boolean> {
  try {
    await access(getCacheFilePath(messageId), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// Save media to cache
export async function saveMediaToCache(
  messageId: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  await ensureCacheDir();
  
  const cacheData: CachedMedia = {
    mimeType,
    data: buffer
  };
  
  await writeFile(
    getCacheFilePath(messageId),
    JSON.stringify(cacheData)
  );
}

// Get media from cache
export async function getMediaFromCache(messageId: string): Promise<CachedMedia | null> {
  try {
    const cacheFile = await readFile(getCacheFilePath(messageId), 'utf-8');
    const cacheData = JSON.parse(cacheFile) as CachedMedia;
    cacheData.data = Buffer.from(cacheData.data);
    return cacheData;
  } catch {
    return null;
  }
}
