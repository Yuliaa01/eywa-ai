import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import { z } from "zod";

interface MealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mealType?: 'breakfast' | 'lunch' | 'snack' | 'dinner';
}

interface MealItem {
  name: string;
  quantity: string;
  calories?: number;
}

// Validation schema
const mealItemSchema = z.object({
  name: z.string().trim().min(1, "Food name is required").max(100, "Food name is too long"),
  quantity: z.string().trim().min(1, "Quantity is required").max(50, "Quantity is too long"),
  calories: z.number().optional(),
});

const mealSchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required"),
  items: z.array(mealItemSchema).min(1, "At least one meal item is required"),
  notes: z.string().max(1000, "Notes are too long").optional(),
});

export function MealModal({ open, onOpenChange, onSuccess, mealType = 'breakfast' }: MealModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MealItem[]>([{ name: "", quantity: "" }]);
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const addItem = () => {
    setItems([...items, { name: "", quantity: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof MealItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const validItems = items.filter(item => item.name && item.quantity);
      
      // Validate the meal data
      const validation = mealSchema.safeParse({
        timestamp,
        items: validItems,
        notes: notes || undefined,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        throw new Error(firstError.message);
      }

      if (validItems.length === 0) {
        throw new Error("Add at least one meal item");
      }

      const { error } = await supabase.from("meals").insert([{
        user_id: user.id,
        timestamp: new Date(timestamp).toISOString(),
        items: validItems as any,
        notes: notes || null,
        source: "manual" as any,
      }]);

      if (error) throw error;

      toast({
        title: "Meal logged",
        description: "Your meal has been recorded successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
      setItems([{ name: "", quantity: "" }]);
      setNotes("");
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
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded">
            Log {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Meal Items *</Label>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Food item"
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="w-24"
                />
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {loading ? "Saving..." : "Log Meal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
