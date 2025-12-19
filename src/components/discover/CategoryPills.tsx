import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface CategoryPillsProps {
  categories: Category[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  className?: string;
}

export function CategoryPills({
  categories,
  selectedSlug,
  onSelect,
  className,
}: CategoryPillsProps) {
  return (
    <ScrollArea className={cn("w-full", className)}>
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            selectedSlug === null
              ? "bg-accent-teal text-white"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          )}
        >
          For You
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.slug)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedSlug === category.slug
                ? "text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            )}
            style={{
              backgroundColor: selectedSlug === category.slug ? category.color : undefined,
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
