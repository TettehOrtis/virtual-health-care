-- Enable extension for UUID if not already
create extension if not exists "uuid-ossp";

-- Create storage bucket for medical records if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'medical-records'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('medical-records', 'medical-records', false);
    END IF;
END $$;

-- Enable RLS on tables if not already enabled
-- No need for UUID to text conversion since all IDs are TEXT in the database

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'MedicalRecord'
    ) THEN
        ALTER TABLE public."MedicalRecord" ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for medical records table
-- Patients can view their own records
create policy "Patients can view their own records"
on public."MedicalRecord"
for select
using (auth.uid()::text = (SELECT "supabaseId" FROM public."Patient" WHERE id = "MedicalRecord"."patientId"));

-- Doctors can view medical records of their patients
create policy "Doctors can view medical records of their patients"
on public."MedicalRecord"
for select
using (
  exists (
    select 1
    from public."Doctor" d
    where d."supabaseId"::text = auth.uid()::text
    and (
      exists (
        select 1
        from public."Prescription" p
        where p."doctorId" = d.id
        and p."patientId" = "MedicalRecord"."patientId"
      )
      or exists (
        select 1
        from public."Appointment" a
        where a."doctorId" = d.id
        and a."patientId" = "MedicalRecord"."patientId"
      )
    )
  )
);

-- Patients can insert their own records
create policy "Patients can insert their own records"
on public."MedicalRecord"
for insert
with check (auth.uid()::text = (SELECT "supabaseId" FROM public."Patient" WHERE id = "MedicalRecord"."patientId"));

-- Doctors can insert medical records for their patients
create policy "Doctors can insert medical records for their patients"
on public."MedicalRecord"
for insert
with check (
  exists (
    SELECT 1
    FROM public."Doctor" d
    WHERE d."supabaseId"::text = auth.uid()::text
    AND (
      exists (
        SELECT 1
        FROM public."Prescription" p
        WHERE p."doctorId" = d.id
        AND p."patientId" = "MedicalRecord"."patientId"
      )
      OR exists (
        SELECT 1
        FROM public."Appointment" a
        WHERE a."doctorId" = d.id
        AND a."patientId" = "MedicalRecord"."patientId"
      )
    )
  )
);

-- Patients can update their own records
create policy "Patients can update their own records"
on public."MedicalRecord"
for update
using (auth.uid()::text = (SELECT "supabaseId" FROM public."Patient" WHERE id = "MedicalRecord"."patientId"));

-- Doctors can update medical records of their patients
create policy "Doctors can update medical records of their patients"
on public."MedicalRecord"
for update
using (
  exists (
    select 1
    from public."Doctor" d
    where d."supabaseId"::text = auth.uid()::text
    and (
      exists (
        select 1
        from public."Prescription" p
        where p."doctorId" = d.id
        and p."patientId" = "MedicalRecord"."patientId"
      )
      or exists (
        select 1
        from public."Appointment" a
        where a."doctorId" = d.id
        and a."patientId" = "MedicalRecord"."patientId"
      )
    )
  )
);

-- Patients can delete their own records
create policy "Patients can delete their own records"
on public."MedicalRecord"
for delete
using (auth.uid()::text = (SELECT "supabaseId" FROM public."Patient" WHERE id = "MedicalRecord"."patientId"));

-- Doctors can delete medical records of their patients
create policy "Doctors can delete medical records of their patients"
on public."MedicalRecord"
for delete
using (
  exists (
    select 1
    from public."Doctor" d
    where d."supabaseId"::text = auth.uid()::text
    and (
      exists (
        select 1
        from public."Prescription" p
        where p."doctorId" = d.id
        and p."patientId" = "MedicalRecord"."patientId"
      )
      or exists (
        select 1
        from public."Appointment" a
        where a."doctorId" = d.id
        and a."patientId" = "MedicalRecord"."patientId"
      )
    )
  )
);

-- Create storage policies
-- Authenticated users can upload to medical-records bucket
create policy "Authenticated users can upload to medical-records"
on storage.objects
for insert
with check (bucket_id = 'medical-records' and auth.role() = 'authenticated');

-- Patients can view their own medical record files
create policy "Patients can view their own medical record files"
on storage.objects
for select
using (
  bucket_id = 'medical-records'
  and exists (
    select 1 
    from public."MedicalRecord" as mr
    join public."Patient" as p on mr."patientId" = p.id
    where mr."fileUrl" = storage.objects.name -- store relative path like medical-records/<patientId>/<file>
    and auth.uid()::text = p."supabaseId"
  )
);

-- Doctors can view medical record files of their patients
create policy "Doctors can view medical record files of their patients"
on storage.objects
for select
using (
  bucket_id = 'medical-records'
  and exists (
    select 1 
    from public."MedicalRecord" as mr
    join public."Doctor" as d on true
    where mr."fileUrl" = storage.objects.name -- stored relative path
    and d."supabaseId"::text = auth.uid()::text
    and (
      exists (
        select 1
        from public."Prescription" p
        where p."doctorId" = d.id
        and p."patientId" = mr."patientId"
      )
      or exists (
        select 1
        from public."Appointment" a
        where a."doctorId" = d.id
        and a."patientId" = mr."patientId"
      )
    )
  )
);

-- Patients can delete their own files
create policy "Patients can delete their own files"
on storage.objects
for delete
using (
  bucket_id = 'medical-records'
  and exists (
    select 1 
    from public."MedicalRecord" as mr
    join public."Patient" as p on mr."patientId" = p.id
    where mr."fileUrl" = storage.objects.name
    and auth.uid()::text = p."supabaseId"
  )
);

-- Doctors can delete medical record files of their patients
create policy "Doctors can delete medical record files of their patients"
on storage.objects
for delete
using (
  bucket_id = 'medical-records'
  and exists (
    select 1 
    from public."MedicalRecord" as mr
    join public."Doctor" as d on true
    where mr."fileUrl" = storage.objects.name
    and d."supabaseId"::text = auth.uid()::text
    and (
      exists (
        select 1
        from public."Prescription" p
        where p."doctorId" = d.id
        and p."patientId" = mr."patientId"
      )
      or exists (
        select 1
        from public."Appointment" a
        where a."doctorId" = d.id
        and a."patientId" = mr."patientId"
      )
    )
  )
);
