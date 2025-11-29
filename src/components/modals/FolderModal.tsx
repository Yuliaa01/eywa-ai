import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderName: string) => void;
  isLoading?: boolean;
  initialName?: string;
  mode?: 'create' | 'edit';
}

export function FolderModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading,
  initialName = "",
  mode = 'create'
}: FolderModalProps) {
  const [folderName, setFolderName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setFolderName(initialName);
    }
  }, [open, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSubmit(folderName.trim());
      setFolderName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'edit' ? 'Rename Folder' : 'Create New Folder'}</DialogTitle>
            <DialogDescription>
              {mode === 'edit' 
                ? 'Enter a new name for your folder.'
                : 'Enter a name for your new folder to organize your files.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!folderName.trim() || isLoading}
              className="rounded-xl"
            >
              {isLoading ? (mode === 'edit' ? "Saving..." : "Creating...") : (mode === 'edit' ? "Save" : "Create Folder")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
