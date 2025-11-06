import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";

interface GroceryItem {
  id: string;
  ingredient: string;
  quantity?: string;
  category?: string;
  checked: boolean;
}

interface RecipeData {
  ingredients: string[];
}

export default function GroceryListSection() {
  const { toast } = useToast();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    loadGroceryList();
  }, []);

  const loadGroceryList = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('grocery_list_items')
        .select('*')
        .eq('user_id', user.id)
        .order('checked', { ascending: true })
        .order('category', { ascending: true });

      if (error) throw error;

      if (data) {
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading grocery list:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFromMealPlan = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get meal plans for current week
      const weekEnd = addDays(currentWeekStart, 6);
      const { data: mealPlans, error: planError } = await supabase
        .from('meal_plans')
        .select('id, recipe_data')
        .eq('user_id', user.id)
        .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      if (planError) throw planError;

      if (!mealPlans || mealPlans.length === 0) {
        toast({
          title: "No Meals Planned",
          description: "Add meals to your weekly planner first to generate a grocery list.",
          variant: "destructive",
        });
        return;
      }

      // Clear existing unchecked items
      await supabase
        .from('grocery_list_items')
        .delete()
        .eq('user_id', user.id)
        .eq('checked', false);

      // Compile all ingredients
      const ingredientsMap = new Map<string, { quantity: string; mealPlanIds: string[] }>();

      mealPlans.forEach(plan => {
        const recipeData = plan.recipe_data as unknown as RecipeData;
        recipeData.ingredients?.forEach((ingredient: string) => {
          const normalized = ingredient.toLowerCase().trim();
          const existing = ingredientsMap.get(normalized);
          
          if (existing) {
            existing.mealPlanIds.push(plan.id);
          } else {
            ingredientsMap.set(normalized, {
              quantity: ingredient,
              mealPlanIds: [plan.id]
            });
          }
        });
      });

      // Insert grocery items
      const groceryItems = Array.from(ingredientsMap.entries()).map(([key, value]) => ({
        user_id: user.id,
        ingredient: value.quantity,
        source_meal_plan_ids: value.mealPlanIds,
        checked: false,
        category: categorizeIngredient(key)
      }));

      const { error: insertError } = await supabase
        .from('grocery_list_items')
        .insert(groceryItems);

      if (insertError) throw insertError;

      await loadGroceryList();
      
      toast({
        title: "Grocery List Generated",
        description: `Added ${groceryItems.length} items from your meal plan`,
      });
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast({
        title: "Error",
        description: "Failed to generate grocery list",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lowerIngredient = ingredient.toLowerCase();
    
    if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
        lowerIngredient.includes('pork') || lowerIngredient.includes('fish') ||
        lowerIngredient.includes('salmon') || lowerIngredient.includes('turkey')) {
      return 'Protein';
    }
    if (lowerIngredient.includes('lettuce') || lowerIngredient.includes('spinach') ||
        lowerIngredient.includes('kale') || lowerIngredient.includes('tomato') ||
        lowerIngredient.includes('carrot') || lowerIngredient.includes('broccoli') ||
        lowerIngredient.includes('pepper')) {
      return 'Produce';
    }
    if (lowerIngredient.includes('milk') || lowerIngredient.includes('cheese') ||
        lowerIngredient.includes('yogurt') || lowerIngredient.includes('butter') ||
        lowerIngredient.includes('cream')) {
      return 'Dairy';
    }
    if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') ||
        lowerIngredient.includes('bread') || lowerIngredient.includes('flour') ||
        lowerIngredient.includes('quinoa')) {
      return 'Grains';
    }
    if (lowerIngredient.includes('oil') || lowerIngredient.includes('sauce') ||
        lowerIngredient.includes('spice') || lowerIngredient.includes('salt') ||
        lowerIngredient.includes('pepper') || lowerIngredient.includes('garlic')) {
      return 'Pantry';
    }
    return 'Other';
  };

  const toggleItem = async (itemId: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ checked })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, checked } : item
      ));
    } catch (error) {
      console.error('Error toggling item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const clearCheckedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('grocery_list_items')
        .delete()
        .eq('user_id', user.id)
        .eq('checked', true);

      if (error) throw error;

      setItems(prev => prev.filter(item => !item.checked));
      
      toast({
        title: "Cleared",
        description: "Checked items have been removed",
      });
    } catch (error) {
      console.error('Error clearing items:', error);
      toast({
        title: "Error",
        description: "Failed to clear items",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#12AFCB] animate-spin" />
        </div>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012] flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#12AFCB]" />
            Grocery List
          </h3>
          <p className="text-sm text-[#5A6B7F] mt-1">
            {items.length > 0 ? `${checkedCount} of ${items.length} items checked` : 'Generate from meal plan'}
          </p>
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCheckedItems}
            >
              Clear Checked
            </Button>
          )}
          <Button
            onClick={generateFromMealPlan}
            disabled={generating}
            className="bg-gradient-to-r from-[#12AFCB] to-[#0E8FA6] hover:opacity-90 text-white"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate from Meal Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
          <p className="text-[#5A6B7F]">
            No items in your grocery list yet. Generate one from your meal plan!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category}>
              <h4 className="font-rounded font-semibold text-[#0E1012] mb-3 text-sm uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.checked
                        ? 'bg-[#12AFCB]/5 border-[#12AFCB]/20'
                        : 'bg-white/80 border-[#12AFCB]/10 hover:border-[#12AFCB]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleItem(item.id, !item.checked)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-[#12AFCB] border-[#12AFCB]'
                            : 'border-[#12AFCB]/30 hover:border-[#12AFCB]'
                        }`}
                      >
                        {item.checked && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span
                        className={`text-sm ${
                          item.checked
                            ? 'line-through text-[#5A6B7F]'
                            : 'text-[#0E1012]'
                        }`}
                      >
                        {item.ingredient}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
