import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface GoalActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalActions({ onEdit, onDelete }: GoalActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-[#12AFCB]/10 focus:outline-none focus:ring-2 focus:ring-[#12AFCB]/20"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4 text-[#5A6B7F]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-white/95 backdrop-blur-xl border-[#12AFCB]/20 shadow-lg z-50"
      >
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="cursor-pointer focus:bg-[#12AFCB]/10"
        >
          <Pencil className="w-4 h-4 mr-2 text-[#12AFCB]" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="cursor-pointer focus:bg-red-50 text-red-600 focus:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
