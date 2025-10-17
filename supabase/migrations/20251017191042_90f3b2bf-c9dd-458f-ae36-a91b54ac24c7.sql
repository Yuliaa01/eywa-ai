-- Add soft delete support to priorities table
ALTER TABLE public.priorities
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add time_scope field for temporary goals (day or week)
ALTER TABLE public.priorities
ADD COLUMN IF NOT EXISTS time_scope text CHECK (time_scope IN ('day', 'week'));

-- Create index for active priorities queries
CREATE INDEX IF NOT EXISTS idx_priorities_active ON public.priorities(user_id, deleted_at) WHERE deleted_at IS NULL;