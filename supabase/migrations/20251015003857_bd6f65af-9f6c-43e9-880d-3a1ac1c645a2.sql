-- Create uploaded_files table for tracking all file uploads
CREATE TABLE public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'parsed', 'error')),
  parsed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Users can manage their own files
CREATE POLICY "Users can manage own uploaded files"
ON public.uploaded_files
FOR ALL
USING (auth.uid() = user_id);

-- Add provenance to lab_results
ALTER TABLE public.lab_results
ADD COLUMN IF NOT EXISTS provenance JSONB;

-- Add trigger for updated_at
CREATE TRIGGER update_uploaded_files_updated_at
BEFORE UPDATE ON public.uploaded_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();