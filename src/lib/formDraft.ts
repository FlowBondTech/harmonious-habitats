/**
 * Form Draft Auto-Save Utility
 * Provides automatic form state persistence to localStorage
 * Prevents data loss when users accidentally close or navigate away
 */

const DRAFT_PREFIX = 'harmonik_draft_';
const DRAFT_EXPIRY_DAYS = 7;

interface DraftMetadata {
  timestamp: number;
  expiresAt: number;
  userId?: string;
}

interface DraftData<T = any> {
  data: T;
  metadata: DraftMetadata;
}

/**
 * Save form data as draft to localStorage
 */
export function saveDraft<T>(key: string, data: T, userId?: string): void {
  try {
    const draftKey = `${DRAFT_PREFIX}${key}`;
    const timestamp = Date.now();
    const expiresAt = timestamp + (DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const draftData: DraftData<T> = {
      data,
      metadata: {
        timestamp,
        expiresAt,
        userId
      }
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save draft:', error);
  }
}

/**
 * Load draft from localStorage
 * Returns null if draft doesn't exist or is expired
 */
export function loadDraft<T>(key: string, userId?: string): T | null {
  try {
    const draftKey = `${DRAFT_PREFIX}${key}`;
    const stored = localStorage.getItem(draftKey);

    if (!stored) return null;

    const draftData: DraftData<T> = JSON.parse(stored);

    // Check if expired
    if (Date.now() > draftData.metadata.expiresAt) {
      deleteDraft(key);
      return null;
    }

    // Check if user matches (if userId provided)
    if (userId && draftData.metadata.userId !== userId) {
      return null;
    }

    return draftData.data;
  } catch (error) {
    console.warn('Failed to load draft:', error);
    return null;
  }
}

/**
 * Delete draft from localStorage
 */
export function deleteDraft(key: string): void {
  try {
    const draftKey = `${DRAFT_PREFIX}${key}`;
    localStorage.removeItem(draftKey);
  } catch (error) {
    console.warn('Failed to delete draft:', error);
  }
}

/**
 * Check if draft exists
 */
export function hasDraft(key: string): boolean {
  try {
    const draftKey = `${DRAFT_PREFIX}${key}`;
    const stored = localStorage.getItem(draftKey);

    if (!stored) return false;

    const draftData: DraftData = JSON.parse(stored);

    // Check if expired
    if (Date.now() > draftData.metadata.expiresAt) {
      deleteDraft(key);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get draft metadata (timestamp, userId, etc.)
 */
export function getDraftMetadata(key: string): DraftMetadata | null {
  try {
    const draftKey = `${DRAFT_PREFIX}${key}`;
    const stored = localStorage.getItem(draftKey);

    if (!stored) return null;

    const draftData: DraftData = JSON.parse(stored);
    return draftData.metadata;
  } catch (error) {
    return null;
  }
}

/**
 * Clean up all expired drafts
 */
export function cleanupExpiredDrafts(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(DRAFT_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const draftData: DraftData = JSON.parse(stored);
            if (now > draftData.metadata.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Invalid draft, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup drafts:', error);
  }
}

/**
 * React Hook for auto-saving form drafts
 * Usage:
 *
 * const { saveDraft, loadDraft, deleteDraft, hasDraft } = useFormDraft('create-event', user?.id);
 *
 * // Load on mount
 * useEffect(() => {
 *   const draft = loadDraft();
 *   if (draft) setFormData(draft);
 * }, []);
 *
 * // Save on change with debounce
 * useEffect(() => {
 *   const timer = setTimeout(() => {
 *     saveDraft(formData);
 *   }, 1000);
 *   return () => clearTimeout(timer);
 * }, [formData]);
 */
export function useFormDraft<T>(key: string, userId?: string) {
  return {
    save: (data: T) => saveDraft(key, data, userId),
    load: () => loadDraft<T>(key, userId),
    delete: () => deleteDraft(key),
    has: () => hasDraft(key),
    getMetadata: () => getDraftMetadata(key)
  };
}

// Clean up expired drafts on module load
cleanupExpiredDrafts();

export default {
  saveDraft,
  loadDraft,
  deleteDraft,
  hasDraft,
  getDraftMetadata,
  cleanupExpiredDrafts,
  useFormDraft
};
