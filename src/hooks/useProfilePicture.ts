import { useState, useEffect, useRef } from 'react';
import { evolutionService } from '@/lib/evolution-service';

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

interface ProfilePictureCache {
  [phoneNumber: string]: CacheEntry;
}

const CACHE_KEY = 'whatsapp_profile_pictures_cache';
const CACHE_TTL_SUCCESS = 24 * 60 * 60 * 1000; // 24 horas para fotos encontradas
const CACHE_TTL_FAILURE = 30 * 60 * 1000; // 30 minutos para falhas
const BATCH_DELAY = 50;
const MAX_CONCURRENT_REQUESTS = 5;

// In-memory cache for faster access
let memoryCache: ProfilePictureCache = {};

const isCacheEntryValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  const ttl = entry.url ? CACHE_TTL_SUCCESS : CACHE_TTL_FAILURE;
  return now - entry.timestamp < ttl;
};

// Retorna o formato alternativo do número brasileiro (com/sem o 9 extra)
// Ex: 5583991377388 (13 dig) → 558391377388 (12 dig), e vice-versa
const getBrazilianAlternativePhone = (phone: string): string | null => {
  if (phone.length === 13 && phone.startsWith('55')) {
    return phone.slice(0, 4) + phone.slice(5);
  }
  if (phone.length === 12 && phone.startsWith('55')) {
    return phone.slice(0, 4) + '9' + phone.slice(4);
  }
  return null;
};

// Busca no cache tentando o número original e o formato alternativo.
// Retorna o entry com URL se encontrar, senão retorna o original (null ou undefined).
const lookupCache = (phone: string): { url: string | null; found: boolean } => {
  const entry = memoryCache[phone];
  if (entry && isCacheEntryValid(entry) && entry.url) {
    return { url: entry.url, found: true };
  }

  const alt = getBrazilianAlternativePhone(phone);
  if (alt) {
    const altEntry = memoryCache[alt];
    if (altEntry && isCacheEntryValid(altEntry) && altEntry.url) {
      // Salva sob o número original para evitar repetir a busca alternativa
      memoryCache[phone] = altEntry;
      return { url: altEntry.url, found: true };
    }
  }

  // Ambos os formatos têm null válido — não precisa buscar de novo
  const originalNullValid = entry && isCacheEntryValid(entry) && !entry.url;
  const altEntry = alt ? memoryCache[alt] : null;
  const altNullValid = altEntry && isCacheEntryValid(altEntry) && !altEntry.url;
  if (originalNullValid && altNullValid) {
    return { url: null, found: true };
  }

  return { url: null, found: false };
};

const loadCacheFromStorage = (): ProfilePictureCache => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ProfilePictureCache;
      const validEntries: ProfilePictureCache = {};
      for (const [key, entry] of Object.entries(parsed)) {
        if (isCacheEntryValid(entry)) {
          validEntries[key] = entry;
        }
      }
      return validEntries;
    }
  } catch (error) {
    console.warn('Failed to load profile picture cache:', error);
  }
  return {};
};

const saveCacheToStorage = (cache: ProfilePictureCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save profile picture cache:', error);
  }
};

memoryCache = loadCacheFromStorage();

interface PendingRequest {
  phoneNumber: string;
  resolve: (url: string | null) => void;
}

let pendingRequests: PendingRequest[] = [];
let isProcessingBatch = false;

const processBatch = async (clienteId: string) => {
  if (isProcessingBatch || pendingRequests.length === 0) return;

  isProcessingBatch = true;

  const batch = pendingRequests.splice(0, MAX_CONCURRENT_REQUESTS);

  for (const request of batch) {
    const { phoneNumber, resolve } = request;

    try {
      let url = await evolutionService.fetchProfilePicture(clienteId, phoneNumber);

      // Se não encontrou, tenta o formato alternativo brasileiro
      if (!url) {
        const alt = getBrazilianAlternativePhone(phoneNumber);
        if (alt) {
          url = await evolutionService.fetchProfilePicture(clienteId, alt);
          if (url) {
            // Cacheia sob o formato alternativo também
            memoryCache[alt] = { url, timestamp: Date.now() };
          }
        }
      }

      memoryCache[phoneNumber] = { url, timestamp: Date.now() };
      saveCacheToStorage(memoryCache);
      resolve(url);
    } catch (error) {
      memoryCache[phoneNumber] = { url: null, timestamp: Date.now() };
      saveCacheToStorage(memoryCache);
      resolve(null);
    }

    if (batch.indexOf(request) < batch.length - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  isProcessingBatch = false;

  if (pendingRequests.length > 0) {
    setTimeout(() => processBatch(clienteId), BATCH_DELAY);
  }
};

export const useProfilePicture = (
  phoneNumber: string | undefined,
  clienteId: string | undefined
): string | null => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!phoneNumber || !clienteId) {
      setProfilePicture(null);
      return;
    }

    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!normalizedPhone) {
      setProfilePicture(null);
      return;
    }

    const { url, found } = lookupCache(normalizedPhone);
    if (found) {
      setProfilePicture(url);
      return;
    }

    fetchedRef.current = false;

    if (!fetchedRef.current) {
      fetchedRef.current = true;

      const promise = new Promise<string | null>((resolve) => {
        pendingRequests.push({ phoneNumber: normalizedPhone, resolve });
      });

      promise.then(setProfilePicture);

      processBatch(clienteId);
    }
  }, [phoneNumber, clienteId]);

  return profilePicture;
};

export const useProfilePictures = (
  phoneNumbers: string[],
  clienteId: string | undefined
): Map<string, string | null> => {
  const [pictures, setPictures] = useState<Map<string, string | null>>(new Map());
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!clienteId || phoneNumbers.length === 0) {
      return;
    }

    const loadPictures = async () => {
      const newPictures = new Map<string, string | null>();
      const phonesToFetch: string[] = [];

      for (const phone of phoneNumbers) {
        const normalizedPhone = phone.replace(/\D/g, '');
        if (!normalizedPhone) continue;

        const { url, found } = lookupCache(normalizedPhone);
        if (found) {
          newPictures.set(normalizedPhone, url);
        } else if (!loadedRef.current.has(normalizedPhone)) {
          phonesToFetch.push(normalizedPhone);
          loadedRef.current.add(normalizedPhone);
        }
      }

      if (newPictures.size > 0) {
        setPictures(prev => {
          const merged = new Map(prev);
          newPictures.forEach((value, key) => merged.set(key, value));
          return merged;
        });
      }

      for (const phone of phonesToFetch) {
        const promise = new Promise<string | null>((resolve) => {
          pendingRequests.push({ phoneNumber: phone, resolve });
        });

        promise.then(url => {
          setPictures(prev => {
            const updated = new Map(prev);
            updated.set(phone, url);
            return updated;
          });
        });
      }

      if (phonesToFetch.length > 0) {
        processBatch(clienteId);
      }
    };

    loadPictures();
  }, [phoneNumbers.join(','), clienteId]);

  return pictures;
};

export const clearProfilePictureCache = () => {
  memoryCache = {};
  localStorage.removeItem(CACHE_KEY);
};