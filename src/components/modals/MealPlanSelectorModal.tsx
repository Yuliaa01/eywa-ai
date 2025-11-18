import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, ChefHat } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

interface MealPlanSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  recipe_data: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl?: string;
  };
}

export function MealPlanSelectorModal({ open, onOpenChange, onSuccess }: MealPlanSelectorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      loadMealPlans();
    }
  }, [open]);

  const loadMealPlans = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load meal plans for current week
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('meal_type', { ascending: true });

      if (error) throw error;
      
      const typedMealPlans = (data || []).map(plan => ({
        ...plan,
        recipe_data: plan.recipe_data as unknown as {
          name: string;
          description: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          imageUrl?: string;
        }
      }));
      
      setMealPlans(typedMealPlans);
    } catch (error) {
      console.error('Error loading meal plans:', error);
      toast({
        title: "Error",
        description: "Failed to load meal plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToToday = async () => {
    if (!selectedMeal) return;
    
    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const recipeData = selectedMeal.recipe_data;
      
      // Add meal to today's meals
      const { error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          timestamp: new Date().toISOString(),
          items: [{
            name: recipeData.name,
            calories: recipeData.calories,
            protein: recipeData.protein,
            carbs: recipeData.carbs,
            fat: recipeData.fat,
          }],
          nutrition_totals: {
            calories: recipeData.calories,
            protein: recipeData.protein,
            carbs: recipeData.carbs,
            fat: recipeData.fat,
          },
          source: 'manual',
          notes: `From meal plan: ${recipeData.name}`,
        });

      if (error) throw error;

      toast({
        title: "Meal Added",
        description: `${recipeData.name} has been added to today's meals`,
      });

      onSuccess();
      onOpenChange(false);
      setSelectedMeal(null);
    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: "Error",
        description: "Failed to add meal",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-rounded text-2xl">Select Meal from Plan</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#12AFCB] animate-spin" />
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
            <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">No Meal Plans</h3>
            <p className="text-[#5A6B7F]">You don't have any meals planned for this week yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {mealPlans.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:border-[#12AFCB]/50 ${
                    selectedMeal?.id === meal.id
                      ? 'border-[#12AFCB] bg-[#12AFCB]/5'
                      : 'border-[#12AFCB]/10 bg-white/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {meal.recipe_data.imageUrl ? (
                      <img
                        src={meal.recipe_data.imageUrl}
                        alt={meal.recipe_data.name}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#12AFCB]/10 to-[#0E8FA6]/10 flex items-center justify-center flex-shrink-0">
                        <ChefHat className="w-8 h-8 text-[#12AFCB]/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#12AFCB] uppercase">
                          {format(new Date(meal.date), 'MMM d')} • {meal.meal_type}
                        </span>
                      </div>
                      <h4 className="font-rounded text-base font-semibold text-[#0E1012] mb-1 truncate">
                        {meal.recipe_data.name}
                      </h4>
                      <p className="text-sm text-[#5A6B7F] mb-2 line-clamp-2">
                        {meal.recipe_data.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#5A6B7F]">
                        <span>{meal.recipe_data.calories} cal</span>
                        <span>P: {meal.recipe_data.protein}g</span>
                        <span>C: {meal.recipe_data.carbs}g</span>
                        <span>F: {meal.recipe_data.fat}g</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToToday}
                disabled={!selectedMeal || adding}
                className="flex-1 bg-[#12AFCB] hover:bg-[#0E8FA6] text-white"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add to Today"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
