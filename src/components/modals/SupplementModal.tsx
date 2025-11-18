import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SupplementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SupplementModal({ open, onOpenChange, onSuccess }: SupplementModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    units: "",
    form: "capsule",
    schedule: "daily",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("supplements").insert({
        user_id: user.id,
        name: formData.name,
        dosage: formData.dosage,
        units: formData.units,
        form: formData.form as any,
        schedule: { frequency: formData.schedule },
        notes: formData.notes || null,
        source: "user",
      });

      if (error) throw error;

      toast({
        title: "Supplement added",
        description: `${formData.name} has been added to your routine.`,
      });

      onSuccess?.();
      onOpenChange(false);
      setFormData({
        name: "",
        dosage: "",
        units: "",
        form: "capsule",
        schedule: "daily",
        notes: "",
      });
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
          <DialogTitle className="text-2xl font-rounded">Add Supplement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Vitamin D', 'Omega-3', 'Magnesium', 'Vitamin C', 'B-Complex', 'Zinc', 'Probiotics', 'Creatine'].map((supplement) => (
                <button
                  key={supplement}
                  type="button"
                  onClick={() => setFormData({ ...formData, name: supplement })}
                  className="px-3 py-1 rounded-full bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 text-[#12AFCB] text-xs font-medium transition-colors"
                >
                  {supplement}
                </button>
              ))}
            </div>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Vitamin D, Omega-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dosage *</Label>
              <Input
                required
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 4000"
              />
            </div>
            <div className="space-y-2">
              <Label>Units *</Label>
              <Input
                required
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                placeholder="IU, mg, g"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Form</Label>
            <Select
              value={formData.form}
              onValueChange={(value) => setFormData({ ...formData, form: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="capsule">Capsule</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="powder">Powder</SelectItem>
                <SelectItem value="liquid">Liquid</SelectItem>
                <SelectItem value="gummy">Gummy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Schedule</Label>
            <Select
              value={formData.schedule}
              onValueChange={(value) => setFormData({ ...formData, schedule: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="with_meals">With Meals</SelectItem>
                <SelectItem value="as_needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
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
              {loading ? "Adding..." : "Add Supplement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
