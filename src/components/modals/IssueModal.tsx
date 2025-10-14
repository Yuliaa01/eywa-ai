import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface IssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IssueModal({ open, onOpenChange, onSuccess }: IssueModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "symptom",
    title: "",
    severity: 5,
    details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("health_issues").insert({
        user_id: user.id,
        category: formData.category as any,
        title: formData.title,
        severity: formData.severity,
        details: formData.details || null,
      });

      if (error) throw error;

      toast({
        title: "Issue logged",
        description: "Your health concern has been recorded.",
      });

      onSuccess?.();
      onOpenChange(false);
      setFormData({
        category: "symptom",
        title: "",
        severity: 5,
        details: "",
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
          <DialogTitle className="text-2xl font-rounded">Log Health Issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anxiety">Anxiety</SelectItem>
                <SelectItem value="symptom">Physical Symptom</SelectItem>
                <SelectItem value="concern">General Concern</SelectItem>
                <SelectItem value="sleep">Sleep Issue</SelectItem>
                <SelectItem value="digestion">Digestive Issue</SelectItem>
                <SelectItem value="pain">Pain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-3">
            <Label>Severity (0-10)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.severity]}
                onValueChange={(value) => setFormData({ ...formData, severity: value[0] })}
                min={0}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-center font-semibold text-[#12AFCB]">
                {formData.severity}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              0 = No concern, 10 = Severe/Emergency
            </p>
          </div>

          <div className="space-y-2">
            <Label>Details</Label>
            <Textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="When did it start? What makes it better/worse?"
              rows={4}
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
              {loading ? "Saving..." : "Log Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
