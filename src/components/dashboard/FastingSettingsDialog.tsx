import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FastingSettingsDialogProps {
  onRefresh?: () => void;
}

const PROTOCOL_CATEGORIES = [
  {
    level: "Beginner",
    description: "Easy start for getting into things",
    badge: "Perfect for you",
    protocols: [
      { value: "12:12", fastHours: 12, eatHours: 12, color: "bg-emerald-100 dark:bg-emerald-900/30" },
      { value: "8:16", fastHours: 8, eatHours: 16, color: "bg-purple-100 dark:bg-purple-900/30" }
    ]
  },
  {
    level: "Regular",
    description: "Best for getting full health benefits",
    protocols: [
      { value: "16:8", fastHours: 16, eatHours: 8, color: "bg-amber-100 dark:bg-amber-900/30" },
      { value: "14:10", fastHours: 14, eatHours: 10, color: "bg-purple-100 dark:bg-purple-900/30" }
    ]
  },
  {
    level: "Expert",
    description: "For experienced fasters seeking maximum benefits",
    protocols: [
      { value: "18:6", fastHours: 18, eatHours: 6, color: "bg-amber-100 dark:bg-amber-900/30" },
      { value: "20:4", fastHours: 20, eatHours: 4, color: "bg-rose-100 dark:bg-rose-900/30" }
    ]
  }
];

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
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-accent" />
            Fasting Settings
          </DialogTitle>
          <DialogDescription>
            Choose your fasting protocol and start your journey
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6 pb-4">
            {PROTOCOL_CATEGORIES.map((category) => (
              <div key={category.level} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{category.level}</h3>
                  {category.badge && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent text-xs">
                      {category.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {category.protocols.map((proto) => (
                    <button
                      key={proto.value}
                      onClick={() => setProtocol(proto.value)}
                      className={`relative p-4 rounded-2xl text-left transition-all duration-200 ${proto.color} ${
                        protocol === proto.value
                          ? "ring-2 ring-accent shadow-lg"
                          : "hover:scale-[1.02] hover:shadow-md"
                      }`}
                    >
                      {protocol === proto.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-2xl font-bold text-foreground mb-2">{proto.value}</div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-foreground/50" />
                          {proto.fastHours} hour fast
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-foreground/50" />
                          {proto.eatHours} hour eating
                        </li>
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 pt-2 space-y-4 border-t border-border">
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
