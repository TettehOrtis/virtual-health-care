import { supabase } from './supabase';
import crypto from 'crypto';

export interface ImageUploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export const uploadImageToSupabase = async (
    file: File,
    bucketName: string,
    folderPath: string = ''
): Promise<ImageUploadResult> => {
    try {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.'
            };
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                success: false,
                error: 'File size too large. Maximum size is 5MB.'
            };
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'jpg';
        const uniqueId = crypto.randomUUID();
        const filePath = folderPath ? `${folderPath}/${uniqueId}.${fileExt}` : `${uniqueId}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return {
                success: false,
                error: 'Failed to upload image to storage.'
            };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return {
            success: true,
            url: publicUrl
        };

    } catch (error) {
        console.error('Image upload error:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during upload.'
        };
    }
};

export const deleteImageFromSupabase = async (
    bucketName: string,
    filePath: string
): Promise<boolean> => {
    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Image deletion error:', error);
        return false;
    }
}; 