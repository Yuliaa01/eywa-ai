import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, Users, Flame, Loader2, Heart, Grid3x3, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddToMealPlanDialog } from "@/components/modals/AddToMealPlanDialog";
import { RecipeDetailModal } from "@/components/modals/RecipeDetailModal";
import { RecipePreferencesDialog } from "@/components/modals/RecipePreferencesDialog";

interface Recipe {
  name: string;
  description: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
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
  savedId?: string;
  isDefault?: boolean;
}

export default function RecipesSection() {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [defaultRecipes, setDefaultRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addToMealPlanOpen, setAddToMealPlanOpen] = useState(false);
  const [selectedRecipeForPlan, setSelectedRecipeForPlan] = useState<Recipe | null>(null);
  const [addingToToday, setAddingToToday] = useState<string | null>(null);
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);

  useEffect(() => {
    loadDefaultRecipes();
    loadSavedRecipes();
  }, []);

  const loadDefaultRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const defaults = data.map((recipe: any) => ({
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          prepTime: recipe.prep_time,
          servings: recipe.servings,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          tags: recipe.tags,
          imageUrl: recipe.image_url,
          isDefault: true,
        }));
        setDefaultRecipes(defaults);
      }
    } catch (error) {
      console.error('Error loading default recipes:', error);
    }
  };

  const loadSavedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const savedRecipes = data.map((saved: any) => ({
          ...saved.recipe_data,
          imageUrl: saved.image_data,
          savedId: saved.id
        }));
        setRecipes(savedRecipes);
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  const generateRecipes = async (preferences?: {
    description?: string;
    ingredients?: string;
    mealType?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: preferences,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        if (error.message.includes('Rate limit')) {
          toast({
            title: "Rate Limit Reached",
            description: "Please wait a moment before generating more recipes.",
            variant: "destructive",
          });
        } else if (error.message.includes('Payment required')) {
          toast({
            title: "Credits Required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Add new recipes to existing ones
      setRecipes(prev => [...data.recipes, ...prev]);
      toast({
        title: "Recipes Generated!",
        description: "Here are your personalized meal suggestions.",
      });
    } catch (error) {
      console.error('Error generating recipes:', error);
      toast({
        title: "Error",
        description: "Failed to generate recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setPreferencesDialogOpen(false);
    }
  };

  const saveRecipe = async (recipe: Recipe, index: number) => {
    setSavingRecipe(recipe.name);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          recipe_name: recipe.name,
          recipe_data: {
            name: recipe.name,
            description: recipe.description,
            category: recipe.category,
            prepTime: recipe.prepTime,
            servings: recipe.servings,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            tags: recipe.tags
          },
          image_data: recipe.imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Update the recipe with savedId
      setRecipes(prev => prev.map((r, i) => 
        i === index ? { ...r, savedId: data.id } : r
      ));

      toast({
        title: "Recipe Saved!",
        description: `${recipe.name} has been added to your favorites.`,
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingRecipe(null);
    }
  };

  const unsaveRecipe = async (savedId: string, index: number) => {
    setSavingRecipe(recipes[index].name);
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      // Remove savedId from the recipe
      setRecipes(prev => prev.map((r, i) => 
        i === index ? { ...r, savedId: undefined } : r
      ));

      toast({
        title: "Recipe Removed",
        description: "Recipe has been removed from your favorites.",
      });
    } catch (error) {
      console.error('Error unsaving recipe:', error);
      toast({
        title: "Error",
        description: "Failed to remove recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingRecipe(null);
    }
  };

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snacks' },
    { value: 'dessert', label: 'Desserts' },
  ];

  // Merge saved/generated recipes with default recipes
  const allRecipes = [...recipes, ...defaultRecipes];

  const filteredRecipes = selectedCategory === 'all' 
    ? allRecipes 
    : allRecipes.filter(recipe => recipe.category === selectedCategory);

  const handleAddToMealPlan = (recipe: Recipe, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedRecipeForPlan(recipe);
    setAddToMealPlanOpen(true);
  };

  const handleAddToToday = async (recipe: Recipe, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddingToToday(recipe.name);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add to meals table
      const { error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          timestamp: new Date().toISOString(),
          items: [
            {
              name: recipe.name,
              quantity: `${recipe.servings} servings`,
            }
          ],
          nutrition_totals: {
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
          },
          source: 'manual',
          notes: recipe.description,
        });

      if (error) throw error;

      toast({
        title: "Added to Today's Meals",
        description: `${recipe.name} has been logged to your meals.`,
      });
    } catch (error: any) {
      console.error('Error adding to today:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add meal",
        variant: "destructive",
      });
    } finally {
      setAddingToToday(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">AI Recipe Suggestions</h3>
          <p className="text-sm text-[#5A6B7F] mt-1">Personalized meals based on your preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          {recipes.length > 0 && (
            <div className="flex gap-1 bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 rounded-xl p-1 mr-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#12AFCB] text-white shadow-sm'
                    : 'text-[#5A6B7F] hover:text-[#0E1012]'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#12AFCB] text-white shadow-sm'
                    : 'text-[#5A6B7F] hover:text-[#0E1012]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
          <Button
            onClick={() => setPreferencesDialogOpen(true)}
            disabled={loading}
            className="bg-gradient-to-r from-[#12AFCB] to-[#0E8FA6] hover:opacity-90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4 mr-2" />
                Generate Recipes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      {allRecipes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.value
                  ? 'bg-[#12AFCB] text-white shadow-sm'
                  : 'bg-white/80 text-[#5A6B7F] hover:bg-[#12AFCB]/10 hover:text-[#12AFCB]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      {allRecipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
          <p className="text-[#5A6B7F]">Click the button above to get AI-generated recipe suggestions tailored to your dietary preferences.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={index}
              className="group rounded-2xl bg-white/80 border border-[#12AFCB]/10 overflow-hidden hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all cursor-pointer"
              onClick={() => {
                setSelectedRecipeForDetail(recipe);
                setRecipeDetailOpen(true);
              }}
            >
              {recipe.imageUrl ? (
                <div className="relative w-full aspect-square overflow-hidden">
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {!recipe.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (recipe.savedId) {
                          unsaveRecipe(recipe.savedId, index);
                        } else {
                          saveRecipe(recipe, index);
                        }
                      }}
                      disabled={savingRecipe === recipe.name}
                      className="absolute top-3 left-3 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full w-9 h-9 p-0"
                    >
                      {savingRecipe === recipe.name ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#12AFCB]" />
                      ) : (
                        <Heart 
                          className={`w-5 h-5 ${recipe.savedId ? 'fill-red-500 text-red-500' : 'text-[#12AFCB]'}`}
                        />
                      )}
                    </Button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="font-rounded text-lg font-semibold text-white mb-2">{recipe.name}</h4>
                    <div className="flex items-center gap-3 text-white/90 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        {recipe.calories} cal
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-[#12AFCB]/10 to-[#0E8FA6]/10 flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-[#12AFCB]/30" />
                  {!recipe.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (recipe.savedId) {
                          unsaveRecipe(recipe.savedId, index);
                        } else {
                          saveRecipe(recipe, index);
                        }
                      }}
                      disabled={savingRecipe === recipe.name}
                      className="absolute top-3 left-3 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full w-9 h-9 p-0"
                    >
                      {savingRecipe === recipe.name ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#12AFCB]" />
                      ) : (
                        <Heart 
                          className={`w-5 h-5 ${recipe.savedId ? 'fill-red-500 text-red-500' : 'text-[#12AFCB]'}`}
                        />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white/80 border border-[#12AFCB]/10 overflow-hidden hover:border-[#12AFCB]/30 transition-all cursor-pointer"
              onClick={() => {
                setSelectedRecipeForDetail(recipe);
                setRecipeDetailOpen(true);
              }}
            >
              {recipe.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">{recipe.name}</h4>
                    <p className="text-sm text-[#5A6B7F] mb-3">{recipe.description}</p>
                  </div>
                  {!recipe.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (recipe.savedId) {
                          unsaveRecipe(recipe.savedId, index);
                        } else {
                          saveRecipe(recipe, index);
                        }
                      }}
                      disabled={savingRecipe === recipe.name}
                      className="ml-2 hover:bg-[#12AFCB]/10"
                    >
                      {savingRecipe === recipe.name ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#12AFCB]" />
                      ) : (
                        <Heart 
                          className={`w-5 h-5 ${recipe.savedId ? 'fill-red-500 text-red-500' : 'text-[#12AFCB]'}`}
                        />
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F]">
                    <Clock className="w-4 h-4 text-[#12AFCB]" />
                    {recipe.prepTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F]">
                    <Users className="w-4 h-4 text-[#12AFCB]" />
                    {recipe.servings} servings
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F]">
                    <Flame className="w-4 h-4 text-[#12AFCB]" />
                    {recipe.calories} cal
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="text-sm">
                    <span className="text-[#5A6B7F]">P: </span>
                    <span className="font-medium text-[#0E1012]">{recipe.protein}g</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[#5A6B7F]">C: </span>
                    <span className="font-medium text-[#0E1012]">{recipe.carbs}g</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[#5A6B7F]">F: </span>
                    <span className="font-medium text-[#0E1012]">{recipe.fat}g</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-3 py-1 rounded-full bg-[#12AFCB]/5 border border-[#12AFCB]/10 text-[#12AFCB] text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddToMealPlanDialog
        open={addToMealPlanOpen}
        onOpenChange={setAddToMealPlanOpen}
        recipe={selectedRecipeForPlan}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('meal-plan-updated'));
        }}
      />

      <RecipeDetailModal
        recipe={selectedRecipeForDetail}
        open={recipeDetailOpen}
        onOpenChange={setRecipeDetailOpen}
        onSave={() => {
          if (selectedRecipeForDetail) {
            const index = recipes.findIndex(r => r.name === selectedRecipeForDetail.name);
            if (index !== -1) saveRecipe(selectedRecipeForDetail, index);
          }
        }}
        onUnsave={() => {
          if (selectedRecipeForDetail?.savedId) {
            const index = recipes.findIndex(r => r.name === selectedRecipeForDetail.name);
            if (index !== -1) unsaveRecipe(selectedRecipeForDetail.savedId, index);
          }
        }}
        onAddToMealPlan={() => {
          if (selectedRecipeForDetail) {
            setRecipeDetailOpen(false); // Close detail modal first
            handleAddToMealPlan(selectedRecipeForDetail);
          }
        }}
        onAddToToday={() => {
          if (selectedRecipeForDetail) handleAddToToday(selectedRecipeForDetail);
        }}
        isSaving={savingRecipe === selectedRecipeForDetail?.name}
        isAddingToToday={addingToToday === selectedRecipeForDetail?.name}
      />

      <RecipePreferencesDialog
        open={preferencesDialogOpen}
        onOpenChange={setPreferencesDialogOpen}
        onGenerate={generateRecipes}
        loading={loading}
      />
    </div>
  );
}
