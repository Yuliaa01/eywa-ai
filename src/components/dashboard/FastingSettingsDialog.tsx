import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FastingSettingsDialogProps {
  onRefresh?: () => void;
}

export function FastingSettingsDialog({ onRefresh }: FastingSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState("16:8");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));

  const calculateEndTime = (start: string, proto: string) => {
    const hours = parseInt(proto.split(":")[0]);
    const startDate = new Date(start);
    startDate.setHours(startDate.getHours() + hours);
    return startDate.toISOString();
  };

  const handleStartNow = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();
      const endTime = calculateEndTime(now, protocol);

      const { data, error } = await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: now,
        end_at: endTime,
        protocol,
      }).select().single();

      if (error) throw error;

      if (data) {
        await supabase.from("fasting_logs").insert({
          user_id: user.id,
          fasting_window_id: data.id,
          action: "started",
          details: { protocol, start_time: now },
        });
      }

      toast({ title: "Fasting started", description: `Your ${protocol} fasting window has begun.` });
      onRefresh?.();
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Convert local datetime to ISO string
      const startDate = new Date(startTime);
      const startIso = startDate.toISOString();
      const endTime = calculateEndTime(startIso, protocol);

      const { data, error } = await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: startIso,
        end_at: endTime,
        protocol,
      }).select().single();

      if (error) throw error;

      if (data) {
        await supabase.from("fasting_logs").insert({
          user_id: user.id,
          fasting_window_id: data.id,
          action: "scheduled",
          details: { protocol, start_time: startTime },
        });
      }

      toast({ title: "Fasting scheduled", description: `Your ${protocol} fasting window has been scheduled.` });
      onRefresh?.();
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-8 h-8 rounded-xl bg-accent/10 hover:bg-accent/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200">
          <Settings className="w-4 h-4 text-accent" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-accent" />
            Fasting Settings
          </DialogTitle>
          <DialogDescription>
            Configure and start your fasting window
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fasting Protocol</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:8">16:8 (16hr fast, 8hr eating)</SelectItem>
                <SelectItem value="18:6">18:6 (18hr fast, 6hr eating)</SelectItem>
                <SelectItem value="20:4">20:4 (20hr fast, 4hr eating)</SelectItem>
                <SelectItem value="24:0">24:0 (24hr fast)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleStartNow}
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-[#19D0E4] hover:opacity-90 text-white"
          >
            {loading ? "Starting..." : "Start Fasting Now"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or schedule</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Start Time</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSchedule}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? "Scheduling..." : "Schedule Fasting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
