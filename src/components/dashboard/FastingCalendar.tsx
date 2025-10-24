import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";

interface FastingCalendarProps {
  onClose?: () => void;
}

export function FastingCalendar({ onClose }: FastingCalendarProps) {
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchCompletedFasts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("fasting_windows")
        .select("*")
        .eq("user_id", user.id)
        .lte("end_at", new Date().toISOString())
        .order("end_at", { ascending: false });

      if (data && !error) {
        const completed = data
          .filter(window => {
            const startTime = new Date(window.start_at);
            const endTime = new Date(window.end_at);
            const now = new Date();
            // Only include if the window has ended
            return endTime < now;
          })
          .map(window => startOfDay(new Date(window.end_at)));
        
        setCompletedDates(completed);
      }
    };

    fetchCompletedFasts();
  }, []);

  const isCompletedDate = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };

  const modifiers = {
    completed: completedDates,
  };

  const modifiersStyles = {
    completed: {
      backgroundColor: "hsl(var(--accent-teal))",
      color: "white",
      fontWeight: "600",
      position: "relative" as const,
    },
  };

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-lg">
      <div className="mb-4">
        <h3 className="font-rounded text-lg font-semibold text-foreground mb-2">
          Fasting Achievement Calendar
        </h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent-teal" />
          Highlighted days show completed fasting goals
        </p>
      </div>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-xl border border-border"
      />

      {selectedDate && isCompletedDate(selectedDate) && (
        <div className="mt-4 p-4 rounded-xl bg-accent-teal/10 border border-accent-teal/20">
          <p className="text-sm font-medium text-accent-teal">
            ✓ Fasting goal achieved on {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
      )}
    </div>
  );
}
