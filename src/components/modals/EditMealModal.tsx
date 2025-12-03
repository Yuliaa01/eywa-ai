import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  meal: any;
}

export function EditMealModal({ open, onOpenChange, onSuccess, meal }: EditMealModalProps) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (meal && open) {
      const mealDate = new Date(meal.timestamp);
      setDate(mealDate.toISOString().split('T')[0]);
      setTime(mealDate.toTimeString().slice(0, 5));
      setNotes(meal.notes || "");
    }
  }, [meal, open]);

  const mealName = meal?.items?.map((item: any) => item.name).join(', ') || 'Meal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meal) return;
    
    setLoading(true);

    try {
      const newTimestamp = new Date(`${date}T${time}`).toISOString();

      const { error } = await supabase
        .from("meals")
        .update({
          timestamp: newTimestamp,
          notes: notes || null,
        })
        .eq('id', meal.id);

      if (error) throw error;

      toast({
        title: "Meal updated",
        description: "Date and time have been updated.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-rounded">Edit Meal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-[#12AFCB]/5 border border-[#12AFCB]/10">
            <p className="text-sm text-muted-foreground">Meal</p>
            <p className="font-medium text-foreground">{mealName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
