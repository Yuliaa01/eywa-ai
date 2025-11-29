-- Create folders table for organizing uploaded files
CREATE TABLE public.file_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own folders
CREATE POLICY "Users can manage own folders"
ON public.file_folders
FOR ALL
USING (auth.uid() = user_id);

-- Add folder_id to uploaded_files table
ALTER TABLE public.uploaded_files
ADD COLUMN folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_file_folders_user_id ON public.file_folders(user_id);
CREATE INDEX idx_uploaded_files_folder_id ON public.uploaded_files(folder_id);