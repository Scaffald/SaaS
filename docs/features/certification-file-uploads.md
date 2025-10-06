# Certification File Uploads

## Overview

The Certification File Uploads feature allows users to upload certificate files (PDFs or images) as proof of their certifications, providing an alternative to or complement for external credential URLs.

## Features

- **Dual Input Options**: Users can either provide an external URL to their certificate OR upload a file
- **Multiple File Types**: Supports PDF, PNG, JPG, and JPEG files
- **Secure Storage**: Files stored in Supabase Storage with user-specific folders
- **Public Access**: Uploaded certificates are publicly accessible for sharing/verification
- **RLS Protection**: Row Level Security ensures users can only manage their own files

## Architecture

### Database Schema

#### user_certifications Table

Added column:
- `certificate_file_path` (text, nullable): Path to uploaded file in Supabase Storage

```sql
ALTER TABLE public.user_certifications
ADD COLUMN certificate_file_path text;
```

The table already includes:
- `credential_url` (text, nullable): External URL to certificate
- Other certification details (name, issuing_organization, dates, etc.)

**Business Rule**: At least one of `credential_url` or `certificate_file_path` should be provided (enforced at application level).

### Storage

#### Bucket: certifications

- **Public Access**: Yes (allows viewing/downloading certificates)
- **File Structure**: `{user_id}/cert-{timestamp}-{sanitized_filename}.{ext}`
- **Supported Types**: PDF, PNG, JPG, JPEG
- **Size Limit**: 5MB (configurable)

#### RLS Policies

```sql
-- Public read access
CREATE POLICY "Certification files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'certifications');

-- User-specific write access
CREATE POLICY "Users can upload their own certification files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- User-specific update/delete
CREATE POLICY "Users can update their own certification files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own certification files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## API Endpoints

### tRPC Router: profile.uploadCertificationFile

**Mutation**: `profile.uploadCertificationFile`

**Input**:
```typescript
{
  certificationId: string (UUID)
  file: string (base64 encoded)
  fileName: string
  contentType: string ('application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg')
}
```

**Output**:
```typescript
{
  success: boolean
  filePath: string
}
```

**Process**:
1. Verify certification belongs to authenticated user
2. Convert base64 to binary data
3. Sanitize filename and generate unique path
4. Upload file to Supabase Storage
5. Update certification record with file path
6. Rollback file upload if database update fails

### tRPC Router: profile.deleteCertificationFile

**Mutation**: `profile.deleteCertificationFile`

**Input**:
```typescript
{
  certificationId: string (UUID)
  filePath: string
}
```

**Output**:
```typescript
{
  success: boolean
}
```

**Process**:
1. Verify certification belongs to authenticated user
2. Verify file path matches certification record
3. Delete file from Storage
4. Clear file path from certification record

## Frontend Implementation

### File Upload Component

Location: `packages/ui/src/components/FileUpload.tsx` (to be created)

**Features**:
- Drag & drop support
- File type validation
- File size validation (5MB max)
- Image preview
- Progress indicator
- Cross-platform compatible (web + native)

### Certification Form Updates

Location: `packages/core/features/profile/profile-certifications-left.tsx`

**Changes**:
- Add radio button toggle: "External URL" vs "Upload File"
- Conditional rendering based on selection
- File upload interface when "Upload File" selected
- Display current file with preview/download link
- Delete file functionality

### Schema Updates

Location: `packages/core/features/profile/config/certifications-schema.ts`

**Updates**:
- Add `certificate_file_path` field
- Update validation to require either URL or file
- Add file type validation

## Security Considerations

### Row Level Security (RLS)

- **Database**: Users can only query/modify their own certification records
- **Storage**: Users can only upload/delete files in their own folder
- **Public Read**: Anyone can view uploaded certificates (for verification purposes)

### File Validation

- **Type Checking**: Server-side validation of content type
- **Filename Sanitization**: Remove special characters, limit length
- **Size Limits**: 5MB maximum file size
- **Unique Names**: Timestamp-based naming prevents conflicts

### Error Handling

- Rollback file upload if database update fails
- Continue database cleanup even if file deletion fails
- Clear error messages for users
- Comprehensive logging for debugging

## Usage Examples

### Upload Certificate File

```typescript
const { mutate: uploadFile } = trpc.profile.uploadCertificationFile.useMutation();

// Convert file to base64
const reader = new FileReader();
reader.onload = () => {
  uploadFile({
    certificationId: cert.id,
    file: reader.result as string,
    fileName: file.name,
    contentType: file.type,
  });
};
reader.readAsDataURL(file);
```

### Delete Certificate File

```typescript
const { mutate: deleteFile } = trpc.profile.deleteCertificationFile.useMutation();

deleteFile({
  certificationId: cert.id,
  filePath: cert.certificate_file_path,
});
```

### Display Certificate

```typescript
// Construct public URL
const publicUrl = `${EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/certifications/${cert.certificate_file_path}`;

// For PDFs
<a href={publicUrl} target="_blank">View Certificate</a>

// For images
<img src={publicUrl} alt="Certificate" />
```

## Migration Files

1. **051_create_certifications_storage_bucket.sql**
   - Creates `certifications` storage bucket
   - Sets up RLS policies for bucket

2. **052_add_certification_file_support.sql**
   - Adds `certificate_file_path` column to `user_certifications`
   - Adds index for performance
   - Documents the column

## Testing

### Manual Testing Steps

1. **Upload Flow**:
   - Create a certification record
   - Upload a PDF certificate
   - Verify file appears in Storage bucket
   - Verify database record updated with file path
   - Verify file is publicly accessible

2. **Delete Flow**:
   - Delete an uploaded certificate file
   - Verify file removed from Storage
   - Verify database record cleared

3. **Security Testing**:
   - Attempt to upload file for another user's certification (should fail)
   - Attempt to delete another user's file (should fail)
   - Verify public read access works without authentication

4. **File Type Testing**:
   - Test with PDF file
   - Test with PNG image
   - Test with JPG image
   - Test with invalid file type (should fail)

5. **Edge Cases**:
   - Test with large file (> 5MB, should fail)
   - Test with special characters in filename
   - Test concurrent uploads
   - Test network interruption during upload

## Future Enhancements

1. **File Size Optimization**:
   - Image compression before upload
   - PDF optimization
   - Thumbnail generation for images

2. **Enhanced Verification**:
   - OCR text extraction from certificates
   - Automatic expiration date detection
   - Certificate authenticity verification

3. **Advanced Features**:
   - Multiple files per certification
   - File versioning
   - Batch upload support
   - Certificate templates

4. **Analytics**:
   - Track upload success rates
   - Monitor storage usage
   - Certificate view/download metrics

## Related Documentation

- [Review System](./review-system.md) - User review features
- [Jobs Preview Modal](./jobs-preview-modal.md) - Job preview functionality
- [RSS Job Feeds](./rss-job-feeds.md) - External job integration

## Implementation Status

- [x] Database migrations created
- [x] Storage bucket configured
- [x] tRPC endpoints implemented
- [x] Schema validation added
- [ ] UI components created
- [ ] Frontend integration complete
- [ ] Testing completed
- [ ] Documentation complete

## Support

For issues or questions:
1. Check migration files in `packages/supabase/migrations/`
2. Review tRPC router at `packages/supabase/functions/trpc/routers/profile/certifications.router.ts`
3. Consult schema definitions in `packages/supabase/functions/_shared/schemas/consolidated.ts`
