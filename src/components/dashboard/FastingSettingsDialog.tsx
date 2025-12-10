import { useState } from "react";
import { Settings, Check, Clock, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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

const WEEKDAYS = [
  { short: "M", full: "Monday" },
  { short: "T", full: "Tuesday" },
  { short: "W", full: "Wednesday" },
  { short: "T", full: "Thursday" },
  { short: "F", full: "Friday" },
  { short: "S", full: "Saturday" },
  { short: "S", full: "Sunday" }
];

export function FastingSettingsDialog({ onRefresh }: FastingSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState("16:8");
  
  // Advanced settings state
  const [customDateTime, setCustomDateTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 5]);

  const calculateEndTime = (start: string, proto: string) => {
    const hours = parseInt(proto.split(":")[0]);
    const startDate = new Date(start);
    startDate.setHours(startDate.getHours() + hours);
    return startDate.toISOString();
  };

  const getStartTime = () => {
    if (customDateTime) {
      return new Date(customDateTime).toISOString();
    }
    return new Date().toISOString();
  };

  const getTimeLabel = () => {
    if (!customDateTime) return "Set time";
    const date = new Date(customDateTime);
    return date.toLocaleString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const toggleDay = (index: number) => {
    setSelectedDays(prev => 
      prev.includes(index) 
        ? prev.filter(d => d !== index)
        : [...prev, index].sort()
    );
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const startTime = getStartTime();
      const endTime = calculateEndTime(startTime, protocol);
      const isScheduled = !!customDateTime && new Date(customDateTime) > new Date();

      const { data, error } = await supabase.from("fasting_windows").insert({
        user_id: user.id,
        start_at: startTime,
        end_at: endTime,
        protocol,
        notes: JSON.stringify({
          schedule_days: selectedDays
        })
      }).select().single();

      if (error) throw error;

      if (data) {
        await supabase.from("fasting_logs").insert({
          user_id: user.id,
          fasting_window_id: data.id,
          action: isScheduled ? "scheduled" : "started",
          details: { 
            protocol, 
            start_time: startTime,
            schedule_days: selectedDays
          },
        });
      }

      const actionLabel = isScheduled ? "scheduled" : "started";
      toast({ 
        title: `Fasting ${actionLabel}`, 
        description: `Your ${protocol} fasting window has been ${actionLabel}.` 
      });
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
        
        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-6 pb-4 px-6">
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

            {/* Advanced Settings Section */}
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold text-foreground">Schedule Settings</h3>
              
              {/* When do you want to start? */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>When do you want to start?</span>
                </div>
                <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 rounded-full border-border hover:border-accent/50"
                    >
                      {getTimeLabel()}
                      <ChevronDown className="w-3 h-3 ml-1.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-background border border-border shadow-lg z-50" align="end">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">Select start time</p>
                      <Input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setCustomDateTime("");
                            setShowTimePicker(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-accent hover:bg-accent/90"
                          onClick={() => setShowTimePicker(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Weekly schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Weekly schedule</span>
                </div>
                <div className="flex justify-between gap-2">
                  {WEEKDAYS.map((day, index) => (
                    <button
                      key={`${day.short}-${index}`}
                      onClick={() => toggleDay(index)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                        selectedDays.includes(index)
                          ? "bg-accent text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={day.full}
                    >
                      {selectedDays.includes(index) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        day.short
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border">
          <Button
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-[#19D0E4] hover:opacity-90 text-white"
          >
            {loading ? "Starting..." : customDateTime && new Date(customDateTime) > new Date() ? "Schedule Fasting" : "Start Fasting Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
