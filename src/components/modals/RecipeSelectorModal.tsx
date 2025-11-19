import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Utensils } from "lucide-react";

interface RecipeSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: any[];
  onSelectRecipe: (recipe: any) => void;
}

export function RecipeSelectorModal({ open, onOpenChange, recipes, onSelectRecipe }: RecipeSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Recipe</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 p-4">
            {recipes.map((recipe, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelectRecipe(recipe);
                  onOpenChange(false);
                }}
                className="p-4 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left"
              >
                <div className="flex gap-4">
                  {recipe.image && (
                    <img 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-rounded font-semibold text-[#0E1012] mb-2">{recipe.name}</h4>
                    <p className="text-sm text-[#5A6B7F] mb-2 line-clamp-2">{recipe.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[#5A6B7F]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime}
                      </span>
                      <span className="font-medium text-[#0E1012]">{recipe.calories} cal</span>
                      <span>P: {recipe.protein}g</span>
                      <span>C: {recipe.carbs}g</span>
                      <span>F: {recipe.fat}g</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
