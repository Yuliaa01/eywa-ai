import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { useState } from "react";

interface Action {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface ActionListProps {
  actions: Action[];
}

const priorityColors = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-orange-500/10 text-orange-600",
  low: "bg-blue-500/10 text-blue-600",
};

export default function ActionList({ actions }: ActionListProps) {
  const [addedActions, setAddedActions] = useState<Set<number>>(new Set());

  const handleAddToPlan = (index: number) => {
    setAddedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <div
          key={index}
          className="p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 transition-all"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-[#0E1012]">{action.title}</h4>
                <Badge className={`text-xs ${priorityColors[action.priority]} border-0`}>
                  {action.priority}
                </Badge>
              </div>
              <p className="text-xs text-[#5A6B7F]">{action.description}</p>
            </div>
            <Button
              size="sm"
              variant={addedActions.has(index) ? "secondary" : "outline"}
              onClick={() => handleAddToPlan(index)}
              className="flex-shrink-0 rounded-lg"
            >
              {addedActions.has(index) ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
