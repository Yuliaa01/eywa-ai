import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Flame, CalendarPlus, Plus, Heart, Loader2, ChefHat } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onUnsave: () => void;
  onAddToMealPlan: () => void;
  onAddToToday: () => void;
  isSaving: boolean;
  isAddingToToday: boolean;
}

export function RecipeDetailModal({
  recipe,
  open,
  onOpenChange,
  onSave,
  onUnsave,
  onAddToMealPlan,
  onAddToToday,
  isSaving,
  isAddingToToday,
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        {/* Hero Image Section */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          {recipe.imageUrl ? (
            <>
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <ChefHat className="w-24 h-24 text-primary/30" />
            </div>
          )}
          
          {/* Title & Quick Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-rounded text-white mb-3">
                {recipe.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">{recipe.servings} servings</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-medium">{recipe.calories} cal</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={recipe.savedId ? onUnsave : onSave}
            disabled={isSaving}
            className="absolute top-4 left-4 bg-background/90 hover:bg-background backdrop-blur-sm rounded-full w-10 h-10 p-0"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Heart 
                className={`w-5 h-5 ${recipe.savedId ? 'fill-red-500 text-red-500' : 'text-primary'}`}
              />
            )}
          </Button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[calc(90vh-20rem)] px-6 pb-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
            <Button
              variant="outline"
              onClick={onAddToMealPlan}
              className="border-primary/30 hover:bg-primary/10"
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Meal Plan
            </Button>
            <Button
              onClick={onAddToToday}
              disabled={isAddingToToday}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isAddingToToday ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Today
                </>
              )}
            </Button>
          </div>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">{recipe.description}</p>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recipe.protein}g</div>
              <div className="text-sm text-muted-foreground mt-1">Protein</div>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recipe.carbs}g</div>
              <div className="text-sm text-muted-foreground mt-1">Carbs</div>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recipe.fat}g</div>
              <div className="text-sm text-muted-foreground mt-1">Fat</div>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-foreground">{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Instructions</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-foreground pt-1 flex-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
