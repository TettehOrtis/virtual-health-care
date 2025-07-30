# Image Upload Functionality

This document describes how to use the image upload functionality in the virtual healthcare platform.

## Overview

The platform supports uploading profile pictures to a Supabase storage bucket called `profile-pictures`. The implementation includes:

- Frontend React components with drag-and-drop support
- Backend API endpoints for secure file uploads
- Automatic file validation and error handling
- Integration with the patient profile system

## Setup Requirements

### 1. Supabase Configuration

Make sure you have the following environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Storage Bucket

Create a storage bucket named `profile-pictures` in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `profile-pictures`
4. Set the bucket to **Public** for profile picture access
5. Configure RLS (Row Level Security) policies as needed

### 3. Database Schema

The patient table includes a `profile_picture_url` field:

```prisma
model Patient {
  id                  String   @id @default(uuid())
  // ... other fields
  profile_picture_url String?
  // ... other fields
}
```

## Usage

### Frontend Components

#### Using the Custom Hook

```tsx
import { useImageUpload } from '@/hooks/useImageUpload';

const MyComponent = () => {
  const { uploading, uploadImage } = useImageUpload({
    onSuccess: (url) => {
      console.log('Image uploaded:', url);
      // Update your component state
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  const handleFileChange = async (file: File) => {
  const imageUrl = await uploadImage(file, '/api/patients/upload-profile-picture');
};

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        accept="image/*"
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};
```

#### Direct API Usage

```tsx
const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/patients/upload-profile-picture', {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data.url;
  }
  
  throw new Error('Upload failed');
};
```

### Backend API

#### Upload Profile Picture Endpoint

**POST** `/api/patients/upload-profile-picture`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field
- Headers: `Authorization: Bearer <token>`

**Note:** The API automatically identifies the patient from the authenticated user's token, so no `patientId` is required in the request body.

**Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "url": "https://your-supabase-url.com/storage/v1/object/public/profile-pictures/filename.jpg"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## File Validation

The system automatically validates uploaded files:

- **File Types**: JPEG, PNG, GIF, WebP
- **File Size**: Maximum 5MB
- **Authentication**: Requires valid user session

## Security Features

1. **Authentication**: All uploads require valid user authentication
2. **File Type Validation**: Only image files are allowed
3. **Size Limits**: Prevents large file uploads
4. **Unique Filenames**: Uses UUID to prevent filename conflicts
5. **Cleanup**: Temporary files are automatically cleaned up

## Error Handling

Common error scenarios and solutions:

1. **"Authentication token not found"**
   - Ensure user is logged in
   - Check token storage in localStorage/sessionStorage

2. **"Invalid file type"**
   - Only upload image files (JPEG, PNG, GIF, WebP)
   - Check file extension and MIME type

3. **"File size too large"**
   - Compress image before upload
   - Maximum size is 5MB

4. **"Storage service error"**
   - Check Supabase configuration
   - Verify bucket permissions
   - Check network connectivity

## Best Practices

1. **Image Optimization**: Compress images before upload for better performance
2. **User Feedback**: Always show loading states during upload
3. **Error Recovery**: Provide clear error messages and retry options
4. **Fallback Images**: Use placeholder images when profile pictures are not available
5. **Caching**: Add cache-busting parameters to image URLs for updates

## Troubleshooting

### Common Issues

1. **Images not displaying**
   - Check if the bucket is set to public
   - Verify the URL is correct
   - Check browser console for CORS errors

2. **Upload fails silently**
   - Check browser network tab for failed requests
   - Verify authentication token is valid
   - Check server logs for errors

3. **Permission denied errors**
   - Verify Supabase RLS policies
   - Check bucket permissions
   - Ensure user has proper authentication

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` to get detailed error messages in API responses. 