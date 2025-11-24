import { Utensils, Droplet, Clock, MapPin, Plus, ChevronRight, Camera, FileText, Calendar, Trash2, Edit2, RefreshCw, Settings } from "lucide-react";
import { MealModal } from "@/components/modals/MealModal";
import { SupplementModal } from "@/components/modals/SupplementModal";
import { FastingQuickStart } from "@/components/modals/FastingQuickStart";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { MealPlanSelectorModal } from "@/components/modals/MealPlanSelectorModal";
import { RecipeSelectorModal } from "@/components/modals/RecipeSelectorModal";
import { NutritionGoalsModal } from "@/components/modals/NutritionGoalsModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import FastingTimer from "./FastingTimer";
import RecipesSection from "./RecipesSection";
import MealPlannerSection from "./MealPlannerSection";
import GroceryListSection from "./GroceryListSection";
import { GlassCard } from "@/components/glass/GlassCard";
import { MetricPill } from "@/components/glass/MetricPill";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableItem } from "@/components/ui/sortable-item";
import { Tables } from "@/integrations/supabase/types";

export default function NutritionSection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [photoMealModalOpen, setPhotoMealModalOpen] = useState(false);
  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);
  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [fastingModalOpen, setFastingModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<any>(null);
  const [recipeSelectorOpen, setRecipeSelectorOpen] = useState(false);
  const [mealToReplace, setMealToReplace] = useState<any>(null);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [fastingWindow, setFastingWindow] = useState({
    start: "20:00",
    end: "12:00",
    progress: 0,
    type: "16:8",
  });
  const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
  const [activeSupplements, setActiveSupplements] = useState<Tables<'supplements'>[]>([]);
  const [macros, setMacros] = useState([
    { name: "Carbs", current: 0, target: 250, color: "#19D0E4", unit: "g" },
    { name: "Protein", current: 0, target: 180, color: "#12AFCB", unit: "g" },
    { name: "Fat", current: 0, target: 80, color: "#0E8FA6", unit: "g" },
  ]);
  const [calories, setCalories] = useState({ current: 0, target: 2000 });
  const [nutritionView, setNutritionView] = useState<'macros' | 'calories'>('macros');
  const [allRecipes, setAllRecipes] = useState<any[]>([]);

  // Fetch active fasting window and today's meals
  useEffect(() => {
    fetchFastingWindow();
    fetchTodaysMeals();
    fetchSupplements();
    fetchNutritionGoals();
    const interval = setInterval(() => {
      fetchFastingWindow();
      fetchTodaysMeals();
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSupplements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveSupplements(data || []);
    } catch (error) {
      console.error('Error fetching supplements:', error);
    }
  };

  const fetchNutritionGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('daily_calories_target, macros_target')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const macrosTarget = data.macros_target as any;
        setMacros([
          { name: "Carbs", current: macros[0].current, target: macrosTarget?.carbs || 250, color: "#19D0E4", unit: "g" },
          { name: "Protein", current: macros[1].current, target: macrosTarget?.protein || 180, color: "#12AFCB", unit: "g" },
          { name: "Fat", current: macros[2].current, target: macrosTarget?.fat || 80, color: "#0E8FA6", unit: "g" },
        ]);
        setCalories({ current: calories.current, target: data.daily_calories_target || 2000 });
      }
    } catch (error) {
      console.error('Error fetching nutrition goals:', error);
    }
  };

  const {
    orderedItems: orderedMeals,
    sensors: mealSensors,
    handleDragEnd: handleMealDragEnd,
    sortingStrategy: mealSortingStrategy,
    itemIds: mealIds,
  } = useDragAndDrop({
    items: todaysMeals,
    storageKey: 'nutrition-meals-order',
    idExtractor: (item) => item.id,
  });

  const {
    orderedItems: orderedSupplements,
    sensors: supplementSensors,
    handleDragEnd: handleSupplementDragEnd,
    sortingStrategy: supplementSortingStrategy,
    itemIds: supplementIds,
  } = useDragAndDrop({
    items: activeSupplements,
    storageKey: 'nutrition-supplements-order',
    idExtractor: (item) => item.id,
  });

  const fetchTodaysMeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', today.toISOString())
        .lt('timestamp', tomorrow.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setTodaysMeals(data || []);

      // Calculate total macros and calories
      let totalCarbs = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCalories = 0;

      data?.forEach((meal: any) => {
        if (meal.nutrition_totals) {
          totalCarbs += meal.nutrition_totals.carbs || 0;
          totalProtein += meal.nutrition_totals.protein || 0;
          totalFat += meal.nutrition_totals.fat || 0;
          totalCalories += meal.nutrition_totals.calories || 0;
        }
      });

      setMacros(prevMacros => [
        { ...prevMacros[0], current: Math.round(totalCarbs) },
        { ...prevMacros[1], current: Math.round(totalProtein) },
        { ...prevMacros[2], current: Math.round(totalFat) },
      ]);
      setCalories(prev => ({ ...prev, current: Math.round(totalCalories) }));
    } catch (error) {
      console.error('Error fetching today\'s meals:', error);
    }
  };

  // Extracted fetchFastingWindow to avoid duplication
  const fetchFastingWindow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("fasting_windows")
        .select("*")
        .eq("user_id", user.id)
        .gte("end_at", new Date().toISOString())
        .order("start_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const startTime = new Date(data.start_at);
        const endTime = new Date(data.end_at);
        const now = new Date();
        const totalDuration = endTime.getTime() - startTime.getTime();
        const elapsed = now.getTime() - startTime.getTime();
        const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

        setFastingWindow({
          start: startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          end: endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          progress,
          type: data.protocol || "16:8",
        });
      }
    } catch (error) {
      console.error("Error fetching fasting window:", error);
    }
  };

  const handleFastingSuccess = () => {
    fetchFastingWindow();
  };

  const nearbyCafes = [
    {
      name: "Green Bowl Café",
      distance: "0.3 mi",
      match: "95% match",
      tags: ["Vegan", "Keto-friendly"],
    },
    {
      name: "Protein Kitchen",
      distance: "0.5 mi",
      match: "90% match",
      tags: ["High-protein", "Low-carb"],
    },
  ];

  const handleAddMeal = (type: 'manual' | 'photo' | 'mealplan') => {
    if (type === 'manual') {
      setMealModalOpen(true);
    } else if (type === 'photo') {
      setPhotoMealModalOpen(true);
    } else {
      setMealPlanModalOpen(true);
    }
  };

  const handleMealSuccess = () => {
    fetchTodaysMeals();
    setEditingMeal(null);
  };

  const handleEditMeal = (meal: any) => {
    setEditingMeal(meal);
    setMealModalOpen(true);
  };

  const handleDeleteMeal = (meal: any) => {
    setMealToDelete(meal);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMeal = async () => {
    if (!mealToDelete) return;

    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealToDelete.id);

      if (error) throw error;

      toast({
        title: "Meal deleted",
        description: "The meal has been removed from your log.",
      });

      fetchTodaysMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast({
        title: "Error",
        description: "Failed to delete meal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setMealToDelete(null);
    }
  };

  const handleReplaceWithRecipe = (meal: any) => {
    setMealToReplace(meal);
    setRecipeSelectorOpen(true);
  };

  const handleRecipeSelected = async (recipe: any) => {
    if (!mealToReplace) return;

    try {
      const { error } = await supabase
        .from('meals')
        .update({
          items: [{ name: recipe.name, quantity: '1 serving' }],
          nutrition_totals: {
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
          },
          notes: recipe.description,
        })
        .eq('id', mealToReplace.id);

      if (error) throw error;

      toast({
        title: "Meal updated",
        description: "Your meal has been replaced with the selected recipe.",
      });

      fetchTodaysMeals();
      setMealToReplace(null);
    } catch (error) {
      console.error('Error replacing meal:', error);
      toast({
        title: "Error",
        description: "Failed to replace meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Nutrition Dashboard */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            {nutritionView === 'macros' ? "Today's Macros" : "Today's Calories"}
          </h3>
          <button
            onClick={() => setGoalsModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            title="Edit goals"
          >
            <Settings className="w-4 h-4 text-[#12AFCB]" />
          </button>
        </div>
        
        {nutritionView === 'macros' ? (
          <div className="grid grid-cols-3 gap-6 mb-6">
            {macros.map((macro) => {
              const percentage = (macro.current / macro.target) * 100;
              return (
                <div key={macro.name} className="relative">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#12AFCB"
                        strokeOpacity="0.1"
                        strokeWidth="10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={macro.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#0E1012]">{macro.current}</span>
                      <span className="text-xs text-[#5A6B7F]">{macro.unit}</span>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <p className="font-rounded font-semibold text-[#0E1012]">{macro.name}</p>
                    <p className="text-sm text-[#5A6B7F]">
                      Goal: {macro.target}
                      {macro.unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#12AFCB"
                  strokeOpacity="0.1"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#12AFCB"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${((calories.current / calories.target) * 100 / 100) * 351.86} 351.86`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#0E1012]">{calories.current}</span>
                <span className="text-xs text-[#5A6B7F]">calories</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-sm text-[#5A6B7F]">
                Goal: {calories.target} cal
              </p>
              <p className="text-xs text-[#5A6B7F] mt-1">
                {Math.max(calories.target - calories.current, 0)} remaining
              </p>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-[#12AFCB]/10">
          <button
            onClick={() => setNutritionView('macros')}
            className={`w-2 h-2 rounded-full transition-all ${
              nutritionView === 'macros'
                ? 'bg-[#12AFCB] w-6'
                : 'bg-[#12AFCB]/30 hover:bg-[#12AFCB]/50'
            }`}
            title="Macros"
          />
          <button
            onClick={() => setNutritionView('calories')}
            className={`w-2 h-2 rounded-full transition-all ${
              nutritionView === 'calories'
                ? 'bg-[#12AFCB] w-6'
                : 'bg-[#12AFCB]/30 hover:bg-[#12AFCB]/50'
            }`}
            title="Calories"
          />
        </div>
      </div>

      {/* Today's Meals */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Today's Meals</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200">
                <Plus className="w-4 h-4 text-[#12AFCB]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleAddMeal('manual')}>
                <FileText className="w-4 h-4 mr-2" />
                Manual Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('photo')}>
                <Camera className="w-4 h-4 mr-2" />
                Photo AI Analyze
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('mealplan')}>
                <Calendar className="w-4 h-4 mr-2" />
                From Meal Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-3">
          {todaysMeals.length === 0 ? (
            <p className="text-sm text-[#5A6B7F]">No meals logged yet today. Click + to add a meal.</p>
          ) : (
            <DndContext
              sensors={mealSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleMealDragEnd}
            >
              <SortableContext items={mealIds} strategy={mealSortingStrategy}>
                {orderedMeals.map((meal) => (
                  <SortableItem key={meal.id} id={meal.id} showHandle={false}>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/80 border border-[#12AFCB]/10">
                      <div className="flex-1">
                        <h4 className="font-rounded font-medium text-[#0E1012] mb-1">
                          {meal.items?.map((item: any) => item.name).join(', ')}
                        </h4>
                        <p className="text-xs text-[#5A6B7F]">
                          {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {meal.nutrition_totals && (
                        <div className="flex gap-3 text-sm mr-3">
                          <span className="text-[#5A6B7F]">
                            <span className="font-medium text-[#0E1012]">{meal.nutrition_totals.calories}</span> cal
                          </span>
                          <span className="text-[#5A6B7F]">
                            P: <span className="font-medium text-[#0E1012]">{meal.nutrition_totals.protein}g</span>
                          </span>
                          <span className="text-[#5A6B7F]">
                            C: <span className="font-medium text-[#0E1012]">{meal.nutrition_totals.carbs}g</span>
                          </span>
                          <span className="text-[#5A6B7F]">
                            F: <span className="font-medium text-[#0E1012]">{meal.nutrition_totals.fat}g</span>
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplaceWithRecipe(meal)}
                          className="p-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors"
                          title="Replace with recipe"
                        >
                          <RefreshCw className="w-4 h-4 text-[#12AFCB]" />
                        </button>
                        <button
                          onClick={() => handleEditMeal(meal)}
                          className="p-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors"
                          title="Edit meal"
                        >
                          <Edit2 className="w-4 h-4 text-[#12AFCB]" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete meal"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fasting Tracker with Timer */}
        <FastingTimer 
          fastingWindow={fastingWindow} 
          onStartFasting={() => setFastingModalOpen(true)}
          onRefresh={handleFastingSuccess}
        />

        {/* Supplements */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)] h-[340px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Supplements</h3>
            <button 
              onClick={() => setSupplementModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {activeSupplements.length === 0 ? (
              <p className="text-sm text-[#5A6B7F]">No supplements added yet. Click + to add.</p>
            ) : (
              <DndContext
                sensors={supplementSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSupplementDragEnd}
              >
                <SortableContext items={supplementIds} strategy={supplementSortingStrategy}>
                  {orderedSupplements.map((supplement) => (
                    <SortableItem key={supplement.id} id={supplement.id} showHandle={false}>
                      <div className="flex items-start justify-between p-4 rounded-xl bg-white/80 border border-[#12AFCB]/10">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#12AFCB] mt-2" />
                          <div>
                            <h4 className="font-rounded font-medium text-[#0E1012]">{supplement.name}</h4>
                            <p className="text-sm text-[#5A6B7F]">{supplement.dosage} {supplement.units || ''}</p>
                          </div>
                        </div>
                        <span className="text-xs text-[#5A6B7F]">{supplement.form || ''}</span>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* AI Recipe Suggestions */}
      <RecipesSection onRecipesChange={setAllRecipes} />

      {/* Weekly Meal Planner */}
      <MealPlannerSection allRecipes={allRecipes} />

      {/* Grocery List */}
      <GroceryListSection />

      {/* Nearby Cafés & Restaurants */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Nearby & Recommended</h3>
          <button 
            onClick={() => navigate('/nearby-restaurants')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 text-[#12AFCB] font-rounded font-medium text-sm transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Find More
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {nearbyCafes.map((cafe) => (
            <button
              key={cafe.name}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Utensils className="w-5 h-5 text-[#12AFCB] mt-0.5" />
                  <div>
                    <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{cafe.name}</h4>
                    <p className="text-sm text-[#5A6B7F]">{cafe.distance}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#5A6B7F] group-hover:text-[#12AFCB] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-full bg-[#12AFCB]/10 text-[#12AFCB] text-xs font-rounded font-medium">
                  {cafe.match}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cafe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#12AFCB]/5 text-[#5A6B7F] text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <MealModal 
        open={mealModalOpen} 
        onOpenChange={(open) => {
          setMealModalOpen(open);
          if (!open) setEditingMeal(null);
        }}
        onSuccess={handleMealSuccess} 
        mealType={selectedMealType}
        existingMeal={editingMeal}
      />
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteMeal}
        title={mealToDelete?.items?.map((item: any) => item.name).join(', ') || 'this meal'}
      />
      <FileUploadModal 
        open={photoMealModalOpen} 
        onOpenChange={setPhotoMealModalOpen} 
        onSuccess={handleMealSuccess}
        uploadType="meal-photo"
        mealType={selectedMealType}
      />
      <MealPlanSelectorModal
        open={mealPlanModalOpen}
        onOpenChange={setMealPlanModalOpen}
        onSuccess={handleMealSuccess}
      />
      <SupplementModal open={supplementModalOpen} onOpenChange={setSupplementModalOpen} onSuccess={() => {}} />
      <FastingQuickStart open={fastingModalOpen} onOpenChange={setFastingModalOpen} onSuccess={handleFastingSuccess} />
      <RecipeSelectorModal
        open={recipeSelectorOpen}
        onOpenChange={setRecipeSelectorOpen}
        recipes={allRecipes}
        onSelectRecipe={handleRecipeSelected}
      />
      <NutritionGoalsModal
        open={goalsModalOpen}
        onOpenChange={setGoalsModalOpen}
        currentGoals={{
          calories: calories.target,
          carbs: macros[0].target,
          protein: macros[1].target,
          fat: macros[2].target,
        }}
        onSuccess={(goals) => {
          setMacros([
            { ...macros[0], target: goals.carbs },
            { ...macros[1], target: goals.protein },
            { ...macros[2], target: goals.fat },
          ]);
          setCalories(prev => ({ ...prev, target: goals.calories }));
        }}
      />
    </div>
  );
}
