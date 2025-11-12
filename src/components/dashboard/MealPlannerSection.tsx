import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, ChefHat, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { format, startOfWeek, addDays } from "date-fns";

interface Recipe {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  calories: number;
  prepTime: string;
}

interface RecipeData {
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
  imageUrl?: string;
}

interface MealPlan {
  id: string;
  date: string;
  meal_type: string;
  recipe_data: RecipeData;
}

interface FastingWindow {
  id: string;
  start_at: string;
  end_at: string | null;
  protocol: string | null;
}

const MealSlot = ({ 
  date, 
  mealType, 
  meal, 
  onRemove 
}: { 
  date: string; 
  mealType: string; 
  meal?: MealPlan; 
  onRemove: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date}-${mealType}`,
    data: { date, mealType }
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[100px] rounded-xl border-2 border-dashed p-3 transition-all ${
        isOver
          ? 'border-[#12AFCB] bg-[#12AFCB]/10'
          : meal
          ? 'border-[#12AFCB]/30 bg-white/80'
          : 'border-[#12AFCB]/10 bg-white/40'
      }`}
    >
      {meal ? (
        <div className="space-y-2">
          {meal.recipe_data.imageUrl && (
            <img
              src={meal.recipe_data.imageUrl}
              alt={meal.recipe_data.name}
              className="w-full h-16 object-cover rounded-lg"
            />
          )}
          <div>
            <h5 className="font-medium text-sm text-[#0E1012] line-clamp-2">
              {meal.recipe_data.name}
            </h5>
            <p className="text-xs text-[#5A6B7F] mt-1">
              {meal.recipe_data.calories} cal • {meal.recipe_data.prepTime}
            </p>
          </div>
          <button
            onClick={() => onRemove(meal.id)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-[#5A6B7F]/50">
          <Plus className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

const DraggableRecipe = ({ recipe }: { recipe: Recipe }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recipe.id,
    data: recipe
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-xl border border-[#12AFCB]/10 bg-white/80 p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-20 object-cover rounded-lg mb-2"
        />
      )}
      <h5 className="font-medium text-sm text-[#0E1012] line-clamp-2">
        {recipe.name}
      </h5>
      <p className="text-xs text-[#5A6B7F] mt-1">
        {recipe.calories} cal • {recipe.prepTime}
      </p>
    </div>
  );
};

export default function MealPlannerSection() {
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [fastingWindows, setFastingWindows] = useState<FastingWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  useEffect(() => {
    // Listen for meal plan updates from other components
    const handleMealPlanUpdate = () => {
      loadData();
    };
    
    window.addEventListener('meal-plan-updated', handleMealPlanUpdate);
    return () => window.removeEventListener('meal-plan-updated', handleMealPlanUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load saved recipes
      const { data: recipes } = await supabase
        .from('saved_recipes')
        .select('id, recipe_name, recipe_data, image_data')
        .order('created_at', { ascending: false });

      if (recipes) {
        setSavedRecipes(recipes.map(r => {
          const recipeData = r.recipe_data as unknown as RecipeData;
          return {
            id: r.id,
            name: recipeData.name,
            category: recipeData.category,
            imageUrl: r.image_data || undefined,
            calories: recipeData.calories,
            prepTime: recipeData.prepTime
          };
        }));
      }

      // Load meal plans for current week
      const weekEnd = addDays(currentWeekStart, 6);
      const { data: plans } = await supabase
        .from('meal_plans')
        .select('*')
        .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));

      if (plans) {
        setMealPlans(plans.map(p => ({
          ...p,
          recipe_data: p.recipe_data as unknown as RecipeData
        })));
      }

      // Load fasting windows for current week
      const { data: fasting } = await supabase
        .from('fasting_windows')
        .select('*')
        .gte('start_at', currentWeekStart.toISOString())
        .lte('start_at', weekEnd.toISOString())
        .order('start_at', { ascending: true });

      if (fasting) {
        setFastingWindows(fasting as FastingWindow[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const recipe = active.data.current as Recipe;
    const { date, mealType } = over.data.current as { date: string; mealType: string };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if meal already exists for this slot
      const existing = mealPlans.find(
        m => m.date === format(new Date(date), 'yyyy-MM-dd') && m.meal_type === mealType
      );

      if (existing) {
        // Update existing meal
        const { error } = await supabase
          .from('meal_plans')
          .update({
            recipe_id: recipe.id,
            recipe_data: await getFullRecipeData(recipe.id) as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new meal
        const { error } = await supabase
          .from('meal_plans')
          .insert({
            user_id: user.id,
            date: format(new Date(date), 'yyyy-MM-dd'),
            meal_type: mealType,
            recipe_id: recipe.id,
            recipe_data: await getFullRecipeData(recipe.id) as any
          });

        if (error) throw error;
      }

      await loadData();
      toast({
        title: "Meal Added",
        description: `${recipe.name} added to ${mealType} on ${format(new Date(date), 'MMM d')}`,
      });
    } catch (error) {
      console.error('Error adding meal:', error);
      toast({
        title: "Error",
        description: "Failed to add meal to planner",
        variant: "destructive",
      });
    }
  };

  const getFullRecipeData = async (recipeId: string): Promise<RecipeData> => {
    const { data } = await supabase
      .from('saved_recipes')
      .select('recipe_data, image_data')
      .eq('id', recipeId)
      .single();

    const recipeData = data?.recipe_data as unknown as RecipeData;
    return {
      ...recipeData,
      imageUrl: data?.image_data || undefined
    };
  };

  const removeMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      setMealPlans(prev => prev.filter(m => m.id !== mealId));
      toast({
        title: "Meal Removed",
        description: "Meal has been removed from your planner",
      });
    } catch (error) {
      console.error('Error removing meal:', error);
      toast({
        title: "Error",
        description: "Failed to remove meal",
        variant: "destructive",
      });
    }
  };

  const getEatingWindowForDay = (day: Date): string => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    // Find fasting window that overlaps with this day
    const fasting = fastingWindows.find(fw => {
      const fastStart = new Date(fw.start_at);
      const fastEnd = fw.end_at ? new Date(fw.end_at) : new Date();
      
      return (fastStart <= dayEnd && fastEnd >= dayStart);
    });

    if (!fasting || !fasting.end_at) {
      return "All day";
    }

    const fastEnd = new Date(fasting.end_at);
    
    // If fasting ends on this day, show eating window from end time
    if (fastEnd.toDateString() === day.toDateString()) {
      return `${format(fastEnd, 'h:mm a')} onwards`;
    }

    // If fasting starts on this day, show eating window until start time
    const fastStart = new Date(fasting.start_at);
    if (fastStart.toDateString() === day.toDateString()) {
      return `Until ${format(fastStart, 'h:mm a')}`;
    }

    // Day is completely within fasting window
    return "Fasting";
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

  if (savedRecipes.length === 0) {
    return (
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">No Saved Recipes</h3>
          <p className="text-[#5A6B7F]">Save some recipes first to start planning your meals</p>
        </div>
      </div>
    );
  }

  const activeRecipe = activeId ? savedRecipes.find(r => r.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Weekly Meal Planner</h3>
            <p className="text-sm text-[#5A6B7F] mt-1">Drag recipes to plan your week</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))}
            >
              Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))}
            >
              Next Week
            </Button>
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd} onDragStart={(e) => setActiveId(e.active.id as string)}>
          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-3 mb-3">
                <div className="font-medium text-sm text-[#5A6B7F]">Meal</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="font-medium text-sm text-[#0E1012]">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-xs text-[#5A6B7F]">
                      {format(day, 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Eating Window Row */}
              <div className="grid grid-cols-8 gap-3 mb-4 pb-3 border-b border-[#12AFCB]/10">
                <div className="flex items-center text-xs text-[#5A6B7F] font-medium">
                  🕐 Eating Window
                </div>
                {weekDays.map((day) => (
                  <div key={`window-${day.toISOString()}`} className="text-center">
                    <div className="text-xs text-[#12AFCB] font-medium bg-[#12AFCB]/5 rounded-lg py-2 px-2">
                      {getEatingWindowForDay(day)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal Rows */}
              {mealTypes.map((mealType) => (
                <div key={mealType} className="grid grid-cols-8 gap-3 mb-3">
                  <div className="flex items-center font-medium text-sm text-[#5A6B7F] capitalize">
                    {mealType}
                  </div>
                  {weekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const meal = mealPlans.find(
                      m => m.date === dateStr && m.meal_type === mealType
                    );
                    return (
                      <MealSlot
                        key={`${dateStr}-${mealType}`}
                        date={day.toISOString()}
                        mealType={mealType}
                        meal={meal}
                        onRemove={removeMeal}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeRecipe && (
              <div className="rounded-xl border border-[#12AFCB]/10 bg-white p-3 shadow-lg">
                {activeRecipe.imageUrl && (
                  <img
                    src={activeRecipe.imageUrl}
                    alt={activeRecipe.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                )}
                <h5 className="font-medium text-sm text-[#0E1012]">{activeRecipe.name}</h5>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Saved Recipes Sidebar */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5 text-[#12AFCB]" />
          <h4 className="font-rounded font-semibold text-[#0E1012]">Your Saved Recipes</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {savedRecipes.map((recipe) => (
            <DraggableRecipe key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
}
