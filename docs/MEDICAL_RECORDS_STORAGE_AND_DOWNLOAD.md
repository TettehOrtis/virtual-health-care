## Medical Records storage and download – implementation notes

- **Bucket**: `medical-records`
- **Object key format**: `<patientId>/<uuid>.<ext>` (no bucket prefix)
- **DB field**: `MedicalRecord.fileUrl` stores the relative object key, not a public URL

### Upload flow

- Frontend (`src/components/medical-records/MedicalRecordUpload.tsx`)
  - Builds object key without the bucket: `<patientId>/<uuid>.<ext>`
  - Uploads with `supabase.storage.from('medical-records').upload(objectKey, file, ...)`
  - Sends record metadata to `/api/patients/medical-records` (POST) with `fileUrl` set to the relative object key

- Backend (`src/pages/api/patients/upload-medical-record.ts`)
  - Uses the same relative object key
  - Persists `fileUrl` as the relative key for RLS and signing

Example key:
```text
8e440731-a95c-4408-ba52-b1b64fd15384/e40bc041-38b8-4c00-a792-abf88ac8d17b.docx
```

### Download flow (server-signed)

- API: `GET /api/patients/medical-records-sign?recordId=<id>&downloadName=<name>`
  - File: `src/pages/api/patients/medical-records-sign.ts`
  - Auth: Bearer JWT; verifies record belongs to the patient
  - Uses server Supabase client (`src/lib/supabaseServer.ts`) with `SUPABASE_SERVICE_ROLE_KEY`
  - Returns `{ url: <signedUrl> }` valid for 5 minutes

- Frontend (`src/components/medical-records/MedicalRecordsList.tsx`)
  - Calls the sign endpoint and redirects to the signed URL
  - Falls back to direct link only if signing fails

Example call:
```ts
const res = await fetch(`/api/patients/medical-records-sign?recordId=${record.id}&downloadName=${encodeURIComponent(record.fileName)}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const { url } = await res.json();
window.location.href = url;
```

### Environment variables

- `NEXT_PUBLIC_SUPABASE_URL` (browser + server)
- `SUPABASE_SERVICE_ROLE_KEY` (server only; used by `supabaseServer`)

### SQL/RLS alignment

- Storage RLS policies in `src/medical-record.sql` compare `mr."fileUrl"` to `storage.objects.name`.
- Storing the relative key ensures this comparison works and avoids errors caused by passing `medical-records/...` or full URLs into SDK calls.

### Common pitfalls avoided

- Passing a full public URL or a key with the bucket prefix to `createSignedUrl` → invalid path/bucket errors.
- Storing full public URLs in DB → breaks RLS comparisons and complicates signing. We store relative keys.

### Testing checklist

- Upload a PDF/DOCX and confirm it appears in the list.
- Click Download → network call to `/api/patients/medical-records-sign` should return 200 and redirect to a Supabase signed URL.
- Verify no requests go to a local path like `/patient-frontend/.../<file>`.

### Relevant files

- `src/components/medical-records/MedicalRecordUpload.tsx`
- `src/components/medical-records/MedicalRecordsList.tsx`
- `src/pages/api/patients/upload-medical-record.ts`
- `src/pages/api/patients/medical-records-sign.ts`
- `src/lib/supabaseServer.ts`
- `src/medical-record.sql` (RLS policies)


