import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, Users, Flame, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  name: string;
  description: string;
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

export default function RecipesSection() {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const generateRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
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

      setRecipes(data.recipes);
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
    }
  };

  return (
    <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">AI Recipe Suggestions</h3>
          <p className="text-sm text-[#5A6B7F] mt-1">Personalized meals based on your preferences</p>
        </div>
        <Button
          onClick={generateRecipes}
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

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-[#12AFCB]/30 mx-auto mb-4" />
          <p className="text-[#5A6B7F]">Click the button above to get AI-generated recipe suggestions tailored to your dietary preferences.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white/80 border border-[#12AFCB]/10 overflow-hidden hover:border-[#12AFCB]/30 transition-all"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedRecipe(expandedRecipe === index ? null : index)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">{recipe.name}</h4>
                    <p className="text-sm text-[#5A6B7F] mb-3">{recipe.description}</p>
                  </div>
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

              {expandedRecipe === index && (
                <div className="border-t border-[#12AFCB]/10 p-6 bg-white/40">
                  <div className="mb-6">
                    <h5 className="font-rounded font-semibold text-[#0E1012] mb-3">Ingredients</h5>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#5A6B7F]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#12AFCB] mt-2 flex-shrink-0" />
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-rounded font-semibold text-[#0E1012] mb-3">Instructions</h5>
                    <ol className="space-y-3">
                      {recipe.instructions.map((instruction, i) => (
                        <li key={i} className="flex gap-3 text-sm text-[#5A6B7F]">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#12AFCB]/10 text-[#12AFCB] flex items-center justify-center text-xs font-semibold">
                            {i + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
