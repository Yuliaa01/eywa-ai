import { Droplets, Cookie, Cherry } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FastingTipsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const tips = [
  {
    icon: Droplets,
    color: "bg-sky-100 dark:bg-sky-900/30 text-sky-500",
    text: "Hydrate with water before, during, and after the fast."
  },
  {
    icon: Cookie,
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-500",
    text: "Avoid processed and unhealthy foods before and after fasting."
  },
  {
    icon: Cherry,
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-500",
    text: "Prepare healthy, fresh foods for your first meal after the fast."
  }
];

export function FastingTipsModal({ open, onOpenChange, onConfirm }: FastingTipsModalProps) {
  const handleConfirm = () => {
    localStorage.setItem("fasting_tips_shown", "true");
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Tips for fasting beginners
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {tips.map((tip, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 p-3 rounded-xl bg-muted/50"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tip.color}`}>
                <tip.icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-foreground leading-relaxed pt-2">
                {tip.text}
              </p>
            </div>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          className="w-full bg-gradient-to-r from-accent to-[#19D0E4] hover:opacity-90 text-white"
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
