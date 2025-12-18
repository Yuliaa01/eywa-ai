import { useState } from "react";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { Pill, Check, ShoppingCart, Sparkles, Leaf, Beaker, Heart, Dna, Fish } from "lucide-react";
import { toast } from "sonner";

interface DosageOption {
  dosage: string;
  price: number;
}

interface VitaminCardProps {
  vitamin: {
    id: string;
    name: string;
    description: string;
    category: string;
    form: string;
    base_price: number;
    dosage_options: DosageOption[];
    benefits: string[];
    suggested_for: string[];
    brand?: string;
  };
  reasoning?: string;
  priority?: 'high' | 'medium' | 'low';
}

const categoryColors: Record<string, string> = {
  vitamins: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  minerals: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  amino_acids: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  herbs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  probiotics: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  omega_fatty_acids: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  specialty: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const categoryIcons: Record<string, React.ElementType> = {
  vitamins: Pill,
  minerals: Beaker,
  amino_acids: Dna,
  herbs: Leaf,
  probiotics: Sparkles,
  omega_fatty_acids: Fish,
  specialty: Heart,
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

export const VitaminCard = ({ vitamin, reasoning, priority }: VitaminCardProps) => {
  const { addItem, isInCart } = useCart();
  const [selectedDosage, setSelectedDosage] = useState<DosageOption>(
    vitamin.dosage_options[0] || { dosage: 'Standard', price: vitamin.base_price }
  );

  const inCart = isInCart(vitamin.id);
  const CategoryIcon = categoryIcons[vitamin.category] || Pill;

  const handleAddToCart = () => {
    if (inCart) return;

    addItem({
      type: 'vitamin',
      id: vitamin.id,
      name: vitamin.name,
      description: vitamin.description,
      category: vitamin.category,
      form: vitamin.form,
      price: selectedDosage.price,
      dosage: selectedDosage.dosage,
      brand: vitamin.brand
    });

    toast.success(`${vitamin.name} added to cart`, {
      description: `${selectedDosage.dosage} - $${selectedDosage.price}`
    });
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <GlassCard className="p-4 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${categoryColors[vitamin.category] || 'bg-muted'}`}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-foreground">{vitamin.name}</h4>
            {priority && (
              <Badge className={`${priorityColors[priority]} text-xs`}>
                {priority} priority
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {vitamin.description}
          </p>

          {reasoning && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mb-3">
              <p className="text-xs text-primary/80 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{reasoning}</span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="outline" className={categoryColors[vitamin.category]}>
              {formatCategory(vitamin.category)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {vitamin.form}
            </Badge>
            {vitamin.brand && (
              <Badge variant="secondary" className="text-xs">
                {vitamin.brand}
              </Badge>
            )}
          </div>

          {vitamin.benefits.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {vitamin.benefits.slice(0, 3).map((benefit, idx) => (
                <span key={idx} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {benefit}
                </span>
              ))}
              {vitamin.benefits.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{vitamin.benefits.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 min-w-[120px]">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${selectedDosage.price}
            </div>
          </div>

          {vitamin.dosage_options.length > 1 && (
            <Select
              value={selectedDosage.dosage}
              onValueChange={(value) => {
                const option = vitamin.dosage_options.find(o => o.dosage === value);
                if (option) setSelectedDosage(option);
              }}
            >
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Select dosage" />
              </SelectTrigger>
              <SelectContent>
                {vitamin.dosage_options.map((option) => (
                  <SelectItem key={option.dosage} value={option.dosage}>
                    {option.dosage} - ${option.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={inCart}
            className={`w-full ${inCart ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};
