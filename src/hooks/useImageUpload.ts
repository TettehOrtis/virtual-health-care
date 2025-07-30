import { useState } from 'react';
import { toast } from 'sonner';

interface UseImageUploadOptions {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    onSuccess?: (url: string) => void;
    onError?: (error: string) => void;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        onSuccess,
        onError
    } = options;

    const [uploading, setUploading] = useState(false);

    const validateFile = (file: File): boolean => {
        if (!allowedTypes.includes(file.type)) {
            const error = `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
            toast.error(error);
            onError?.(error);
            return false;
        }

        if (file.size > maxSize) {
            const error = `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`;
            toast.error(error);
            onError?.(error);
            return false;
        }

        return true;
    };

      const uploadImage = async (
    file: File,
    endpoint: string,
    additionalData?: Record<string, any>
  ): Promise<string | null> => {
    if (!validateFile(file)) {
      return null;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional data to form (if needed for other endpoints)
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload image');
            }

            const data = await response.json();
            const imageUrl = data.url;

            if (imageUrl) {
                toast.success('Image uploaded successfully');
                onSuccess?.(imageUrl);
                return imageUrl;
            } else {
                throw new Error('No image URL received from server');
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            const errorMessage = error.message || 'Failed to upload image';
            toast.error(errorMessage);
            onError?.(errorMessage);
            return null;
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        uploadImage,
        validateFile
    };
}; 