import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FastingQuickStartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FastingQuickStart({ open, onOpenChange, onSuccess }: FastingQuickStartProps) {
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState("16:8");
  const [startTime, setStartTime] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const calculateEndTime = (start: string, protocol: string) => {
    const hours = parseInt(protocol.split(":")[0]);
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

      const { error } = await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: now,
        end_at: endTime,
        protocol,
      });

      if (error) throw error;

      toast({
        title: "Fasting started",
        description: `Your ${protocol} fasting window has begun.`,
      });

      onSuccess?.();
      onOpenChange(false);
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

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endTime = calculateEndTime(startTime, protocol);

      const { error } = await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: startTime,
        end_at: endTime,
        protocol,
      });

      if (error) throw error;

      toast({
        title: "Fasting scheduled",
        description: `Your ${protocol} fasting window has been scheduled.`,
      });

      onSuccess?.();
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded">Start Fasting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fasting Protocol</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger>
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

          <div className="space-y-3">
            <Button
              onClick={handleStartNow}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:opacity-90"
            >
              {loading ? "Starting..." : "Start Now"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#12AFCB]/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                  Or schedule
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
