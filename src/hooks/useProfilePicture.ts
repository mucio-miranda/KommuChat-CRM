import { useState, useEffect, useCallback, useRef } from 'react';
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
const CACHE_TTL_FAILURE = 30 * 60 * 1000; // 30 minutos para falhas (permite retry mais rápido)
const BATCH_DELAY = 50; // Delay entre requests em ms
const MAX_CONCURRENT_REQUESTS = 5; // Aumentado para melhor performance

// In-memory cache for faster access
let memoryCache: ProfilePictureCache = {};

// Verifica se uma entrada de cache é válida baseado no TTL apropriado
const isCacheEntryValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  const ttl = entry.url ? CACHE_TTL_SUCCESS : CACHE_TTL_FAILURE;
  return now - entry.timestamp < ttl;
};

// Load cache from localStorage on module init
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

// Save cache to localStorage
const saveCacheToStorage = (cache: ProfilePictureCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save profile picture cache:', error);
  }
};

// Initialize memory cache from localStorage
memoryCache = loadCacheFromStorage();

// Pending requests queue for batching
interface PendingRequest {
  phoneNumber: string;
  resolve: (url: string | null) => void;
}

let pendingRequests: PendingRequest[] = [];
let isProcessingBatch = false;

const processBatch = async (clienteId: string) => {
  if (isProcessingBatch || pendingRequests.length === 0) return;
  
  isProcessingBatch = true;
  
  // Take a batch of requests
  const batch = pendingRequests.splice(0, MAX_CONCURRENT_REQUESTS);
  
  // Process each request with a small delay between them
  for (const request of batch) {
    const { phoneNumber, resolve } = request;
    
    try {
      const url = await evolutionService.fetchProfilePicture(clienteId, phoneNumber);
      
      // Update cache
      const entry: CacheEntry = { url, timestamp: Date.now() };
      memoryCache[phoneNumber] = entry;
      saveCacheToStorage(memoryCache);
      
      resolve(url);
    } catch (error) {
      // On error, cache null to avoid repeated failed requests
      const entry: CacheEntry = { url: null, timestamp: Date.now() };
      memoryCache[phoneNumber] = entry;
      saveCacheToStorage(memoryCache);
      
      resolve(null);
    }
    
    // Small delay between requests to avoid rate limiting
    if (batch.indexOf(request) < batch.length - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
  
  isProcessingBatch = false;
  
  // Process next batch if there are more pending requests
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

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phoneNumber.replace(/\D/g, '');
    if (!normalizedPhone) {
      setProfilePicture(null);
      return;
    }

    // Check memory cache first
    const cached = memoryCache[normalizedPhone];
    if (cached && isCacheEntryValid(cached)) {
      setProfilePicture(cached.url);
      return;
    }

    // Reset fetched ref when phone changes
    fetchedRef.current = false;

    // Queue the request
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      
      const promise = new Promise<string | null>((resolve) => {
        pendingRequests.push({ phoneNumber: normalizedPhone, resolve });
      });

      promise.then(setProfilePicture);
      
      // Start processing if not already
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

      // Check cache for each phone number
      for (const phone of phoneNumbers) {
        const normalizedPhone = phone.replace(/\D/g, '');
        if (!normalizedPhone) continue;

        const cached = memoryCache[normalizedPhone];
        if (cached && isCacheEntryValid(cached)) {
          newPictures.set(normalizedPhone, cached.url);
        } else if (!loadedRef.current.has(normalizedPhone)) {
          phonesToFetch.push(normalizedPhone);
          loadedRef.current.add(normalizedPhone);
        }
      }

      // Update with cached values first
      if (newPictures.size > 0) {
        setPictures(prev => {
          const merged = new Map(prev);
          newPictures.forEach((value, key) => merged.set(key, value));
          return merged;
        });
      }

      // Fetch uncached pictures
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

      // Start processing
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
