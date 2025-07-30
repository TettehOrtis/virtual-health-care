import { useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ImageUploadTest = () => {
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const { uploading, uploadImage } = useImageUpload({
        onSuccess: (url) => {
            setUploadedUrl(url);
            toast.success('Test upload successful!');
        },
        onError: (error) => {
            toast.error(`Test upload failed: ${error}`);
        }
    });

    const handleTestUpload = async () => {
        // Create a simple test image (1x1 pixel PNG)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1, 1);
        }

        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], 'test-image.png', { type: 'image/png' });
                await uploadImage(file, '/api/patients/upload-profile-picture');
            }
        }, 'image/png');
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Image Upload Test</h3>
            <Button
                onClick={handleTestUpload}
                disabled={uploading}
                className="mb-4"
            >
                {uploading ? 'Uploading...' : 'Test Upload'}
            </Button>

            {uploadedUrl && (
                <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Uploaded Image:</p>
                    <img
                        src={uploadedUrl}
                        alt="Test upload"
                        className="w-32 h-32 object-cover border rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2 break-all">{uploadedUrl}</p>
                </div>
            )}
        </div>
    );
}; 