import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SaveWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  duration: string;
}

export function SaveWorkoutDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  duration,
}: SaveWorkoutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-[#12AFCB]/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-rounded">Save workout?</AlertDialogTitle>
          <AlertDialogDescription>
            You've worked out for {duration}. Would you like to save this workout?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="rounded-xl">
            Discard
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onSave}
            className="rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:opacity-90"
          >
            Save Workout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
