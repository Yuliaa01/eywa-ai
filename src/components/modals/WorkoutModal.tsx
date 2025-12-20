import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { triggerWorkoutReward } from "@/hooks/useRewardTrigger";

interface WorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WorkoutModal({ open, onOpenChange, onSuccess }: WorkoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    block_name: "",
    sessions: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let sessionsData;
      try {
        sessionsData = JSON.parse(formData.sessions || "{}");
      } catch {
        sessionsData = { description: formData.sessions };
      }

      const { error } = await supabase.from("workout_plans").insert([{
        user_id: user.id,
        block_name: formData.block_name,
        sessions: sessionsData,
      }]);

      if (error) throw error;

      toast({
        title: "Workout added",
        description: "Your workout plan has been created.",
      });

      // Trigger reward check
      await triggerWorkoutReward(user.id);

      onSuccess?.();
      onOpenChange(false);
      setFormData({ block_name: "", sessions: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded">Add Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Workout Name *</Label>
            <Input
              required
              value={formData.block_name}
              onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
              placeholder="e.g., Upper Body Strength, HIIT Session"
            />
          </div>

          <div className="space-y-2">
            <Label>Workout Details</Label>
            <Textarea
              value={formData.sessions}
              onChange={(e) => setFormData({ ...formData, sessions: e.target.value })}
              placeholder="Describe exercises, sets, reps, zones..."
              rows={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating..." : "Create Workout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
