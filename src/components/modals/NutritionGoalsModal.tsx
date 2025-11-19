import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NutritionGoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  onSuccess: (goals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  }) => void;
}

export function NutritionGoalsModal({
  open,
  onOpenChange,
  currentGoals,
  onSuccess,
}: NutritionGoalsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState(currentGoals);

  useEffect(() => {
    setGoals(currentGoals);
  }, [currentGoals, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if nutrition plan exists
      const { data: existingPlan } = await supabase
        .from('nutrition_plans')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const macrosTarget = {
        carbs: goals.carbs,
        protein: goals.protein,
        fat: goals.fat,
      };

      if (existingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('nutrition_plans')
          .update({
            daily_calories_target: goals.calories,
            macros_target: macrosTarget,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase
          .from('nutrition_plans')
          .insert({
            user_id: user.id,
            daily_calories_target: goals.calories,
            macros_target: macrosTarget,
          });

        if (error) throw error;
      }

      toast({
        title: "Goals updated",
        description: "Your nutrition goals have been saved successfully.",
      });

      onSuccess(goals);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error",
        description: "Failed to save nutrition goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Nutrition Goals</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Daily Calories Target</Label>
            <Input
              id="calories"
              type="number"
              min="0"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs Target (g)</Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              value={goals.carbs}
              onChange={(e) => setGoals({ ...goals, carbs: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Protein Target (g)</Label>
            <Input
              id="protein"
              type="number"
              min="0"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Fat Target (g)</Label>
            <Input
              id="fat"
              type="number"
              min="0"
              value={goals.fat}
              onChange={(e) => setGoals({ ...goals, fat: parseInt(e.target.value) || 0 })}
              required
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
              {loading ? "Saving..." : "Save Goals"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
