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
        .not("actual_end_at", "is", null)
        .order("end_at", { ascending: false });

      if (data && !error) {
        const completed = data.map(window => startOfDay(new Date(window.actual_end_at)));
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

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-lg">
      <div className="mb-4">
        <h3 className="font-rounded text-lg font-semibold text-foreground mb-2">
          Fasting Achievement Calendar
        </h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#12AFCB]" />
          Highlighted days show completed fasting goals
        </p>
      </div>
      
      <style>{`
        .fasting-calendar .rdp-day_completed {
          position: relative;
          background: transparent !important;
        }
        .fasting-calendar .rdp-day_completed::before {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          padding: 2px;
          background: linear-gradient(135deg, #22C55E, #12AFCB);
          -webkit-mask: 
            linear-gradient(#fff 0 0) content-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .fasting-calendar .rdp-day_completed > span,
        .fasting-calendar .rdp-day_completed > button {
          position: relative;
          z-index: 1;
        }
      `}</style>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        modifiers={modifiers}
        modifiersClassNames={{
          completed: "rdp-day_completed",
        }}
        className="rounded-xl border border-border fasting-calendar"
      />

      {selectedDate && isCompletedDate(selectedDate) && (
        <div className="mt-4 p-4 rounded-xl bg-[#12AFCB]/10 border border-[#12AFCB]/20">
          <p className="text-sm font-medium text-[#12AFCB]">
            ✓ Fasting goal achieved on {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
      )}
    </div>
  );
}
