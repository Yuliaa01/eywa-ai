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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-[#12AFCB]/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-rounded">Delete "{title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone, but you'll have 10 seconds to undo from the notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
