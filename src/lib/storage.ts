import { supabase } from './supabase';

// Storage utility functions for handling file uploads

export interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  bucket: 'space-images',
  folder: 'spaces',
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif']
};

/**
 * Upload a single file to Supabase Storage with validation
 */
export const uploadFile = async (
  file: File, 
  userId: string, 
  options: Partial<UploadOptions> = {}
): Promise<{ url: string | null; error: string | null }> => {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: null, error: `${file.name} is not a valid image` };
    }
    
    // Validate file size
    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
      const sizeMB = Math.round(opts.maxSizeBytes / (1024 * 1024));
      return { url: null, error: `${file.name} is too large. Please choose images under ${sizeMB}MB.` };
    }
    
    // Validate file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || (opts.allowedTypes && !opts.allowedTypes.includes(fileExt))) {
      return { url: null, error: `${file.name} has an unsupported format. Allowed: ${opts.allowedTypes?.join(', ').toUpperCase()}` };
    }
    
    // Create file path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2);
    const fileName = opts.folder 
      ? `${userId}/${opts.folder}/${timestamp}_${randomSuffix}.${fileExt}`
      : `${userId}/${timestamp}_${randomSuffix}.${fileExt}`;
    
    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(opts.bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { url: null, error: `Failed to upload ${file.name}: ${uploadError.message}` };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(opts.bucket)
      .getPublicUrl(fileName);
    
    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return { url: null, error: `Failed to upload ${file.name}: ${error.message}` };
  }
};

/**
 * Upload multiple files with progress tracking
 */
export const uploadFiles = async (
  files: File[], 
  userId: string, 
  options: Partial<UploadOptions> = {},
  onProgress?: (completed: number, total: number, errors: string[]) => void
): Promise<{ urls: string[]; errors: string[] }> => {
  const urls: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { url, error } = await uploadFile(file, userId, options);
    
    if (url) {
      urls.push(url);
    } else if (error) {
      errors.push(error);
    }
    
    // Call progress callback if provided
    onProgress?.(i + 1, files.length, errors);
  }
  
  return { urls, errors };
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (url: string, bucket: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Extract file path from URL
    const pathMatch = url.match(new RegExp(`\\/${bucket}\\/(.+)$`));
    if (!pathMatch) {
      return { success: false, error: 'Invalid file URL format' };
    }
    
    const filePath = pathMatch[1];
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Unexpected delete error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple files from Supabase Storage
 */
export const deleteFiles = async (urls: string[], bucket: string): Promise<{ successCount: number; errors: string[] }> => {
  let successCount = 0;
  const errors: string[] = [];
  
  for (const url of urls) {
    const { success, error } = await deleteFile(url, bucket);
    if (success) {
      successCount++;
    } else if (error) {
      errors.push(error);
    }
  }
  
  return { successCount, errors };
};

/**
 * Check if a storage bucket exists and is accessible
 */
export const checkBucketAccess = async (bucket: string): Promise<{ accessible: boolean; error: string | null }> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
    
    if (error) {
      return { accessible: false, error: error.message };
    }
    
    return { accessible: true, error: null };
  } catch (error: any) {
    return { accessible: false, error: error.message };
  }
};

// Storage bucket configurations
export const STORAGE_BUCKETS = {
  SPACE_IMAGES: 'space-images',
  PROFILE_IMAGES: 'profile-images',
  EVENT_IMAGES: 'event-images'
} as const;

export const UPLOAD_PRESETS = {
  SPACE_IMAGES: {
    bucket: STORAGE_BUCKETS.SPACE_IMAGES,
    folder: 'spaces',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp']
  },
  PROFILE_IMAGES: {
    bucket: STORAGE_BUCKETS.PROFILE_IMAGES,
    folder: 'avatars',
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp']
  },
  EVENT_IMAGES: {
    bucket: STORAGE_BUCKETS.EVENT_IMAGES,
    folder: 'events',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp']
  }
} as const;