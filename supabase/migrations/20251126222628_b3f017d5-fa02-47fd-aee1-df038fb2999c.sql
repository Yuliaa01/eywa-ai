-- Create table for saved doctors
CREATE TABLE IF NOT EXISTS public.saved_doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, doctor_id),
  CONSTRAINT fk_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.saved_doctors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved doctors"
  ON public.saved_doctors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save doctors"
  ON public.saved_doctors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave doctors"
  ON public.saved_doctors
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_doctors_user_id ON public.saved_doctors(user_id);
CREATE INDEX idx_saved_doctors_doctor_id ON public.saved_doctors(doctor_id);