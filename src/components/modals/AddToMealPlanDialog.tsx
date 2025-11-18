import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  name: string;
  description: string;
  category: string;
  prepTime: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

interface AddToMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: Recipe | null;
  targetDate?: string;
  targetMealType?: string;
  allRecipes?: Recipe[];
  onSuccess?: () => void;
}

export function AddToMealPlanDialog({ open, onOpenChange, recipe, targetDate, targetMealType, allRecipes = [], onSuccess }: AddToMealPlanDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(recipe || null);
  const [selectedDate, setSelectedDate] = useState<Date>(targetDate ? new Date(targetDate) : new Date());
  const [selectedMealType, setSelectedMealType] = useState<string>(targetMealType || "lunch");

  const mealTypes = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  // Use provided allRecipes instead of loading from database
  const availableRecipes = recipe ? [recipe] : allRecipes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipeToAdd = recipe || selectedRecipe;
    if (!recipeToAdd) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Check if meal already exists for this date/type
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .eq("meal_type", selectedMealType)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("meal_plans")
          .update({
            recipe_data: recipeToAdd as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("meal_plans")
          .insert([{
            user_id: user.id,
            date: dateStr,
            meal_type: selectedMealType,
            recipe_data: recipeToAdd as any,
          }]);

        if (error) throw error;
      }

      toast({
        title: "Added to Meal Plan",
        description: `${recipeToAdd.name} added to ${selectedMealType} on ${format(selectedDate, "MMM d, yyyy")}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding to meal plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add to meal plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-[#12AFCB]/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-rounded">Add to Meal Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!recipe && availableRecipes.length > 0 && (
            <div>
              <Label>Select Recipe</Label>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto mt-2">
                {availableRecipes.map((availableRecipe, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedRecipe(availableRecipe)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      selectedRecipe?.name === availableRecipe.name
                        ? 'border-[#12AFCB] bg-[#12AFCB]/5'
                        : 'border-gray-200 hover:border-[#12AFCB]/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{availableRecipe.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {availableRecipe.calories} cal • {availableRecipe.prepTime}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {recipe && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Adding: <span className="font-medium text-foreground">{recipe.name}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Meal Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedMealType(type.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMealType === type.value
                      ? "bg-[#12AFCB] text-white"
                      : "bg-white/80 text-[#5A6B7F] hover:bg-[#12AFCB]/10 border border-[#12AFCB]/10"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
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
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#12AFCB] to-[#0E8FA6]"
              disabled={loading || (!recipe && !selectedRecipe)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Plan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
