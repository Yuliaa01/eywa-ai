import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChefHat, Loader2 } from "lucide-react";

interface RecipePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (preferences: {
    description?: string;
    ingredients?: string;
    mealType?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function RecipePreferencesDialog({
  open,
  onOpenChange,
  onGenerate,
  loading = false,
}: RecipePreferencesDialogProps) {
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType] = useState("any");

  const handleGenerate = async () => {
    await onGenerate({
      description: description.trim() || undefined,
      ingredients: ingredients.trim() || undefined,
      mealType: mealType !== "any" ? mealType : undefined,
    });
    // Reset form after generation
    setDescription("");
    setIngredients("");
    setMealType("any");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#12AFCB]/10 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-[#12AFCB]" />
            </div>
            <div>
              <DialogTitle>Customize Your Recipes</DialogTitle>
              <DialogDescription>
                Tell us what you're craving (or leave blank for general suggestions)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What do you want to eat? */}
          <div className="space-y-2">
            <Label htmlFor="description">What do you want to eat?</Label>
            <Textarea
              id="description"
              placeholder="e.g., Something spicy, comfort food, quick breakfast..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* What ingredients do you have? */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">What ingredients do you have?</Label>
            <Textarea
              id="ingredients"
              placeholder="e.g., chicken, broccoli, rice, tomatoes..."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="mealType">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground bg-[#12AFCB]/5 rounded-lg p-3">
            💡 <strong>Tip:</strong> All fields are optional. Leave them blank to get general suggestions based on your profile.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
