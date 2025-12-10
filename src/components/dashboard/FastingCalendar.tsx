import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FastingHistoryModal } from "@/components/modals/FastingHistoryModal";

interface FastingWindow {
  id: string;
  user_id: string;
  start_at: string;
  end_at: string | null;
  actual_end_at: string | null;
  protocol: string | null;
  notes: string | null;
  is_paused: boolean | null;
}

interface FastingCalendarProps {
  onClose?: () => void;
}

export function FastingCalendar({ onClose }: FastingCalendarProps) {
  const [fastingRecords, setFastingRecords] = useState<FastingWindow[]>([]);
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedFast, setSelectedFast] = useState<FastingWindow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompletedFasts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("fasting_windows")
      .select("*")
      .eq("user_id", user.id)
      .not("actual_end_at", "is", null)
      .order("actual_end_at", { ascending: false });

    if (data && !error) {
      setFastingRecords(data);
      const completed = data.map(window => startOfDay(new Date(window.actual_end_at!)));
      setCompletedDates(completed);
    }
  };

  useEffect(() => {
    fetchCompletedFasts();
  }, []);

  const isCompletedDate = (date: Date) => {
    return completedDates.some(completedDate => isSameDay(completedDate, date));
  };

  const getFastsForDate = (date: Date): FastingWindow[] => {
    return fastingRecords.filter(record => 
      record.actual_end_at && isSameDay(startOfDay(new Date(record.actual_end_at)), startOfDay(date))
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const fastsOnDate = getFastsForDate(date);
    if (fastsOnDate.length > 0) {
      // If multiple fasts on same day, show the most recent one
      setSelectedFast(fastsOnDate[0]);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFast(null);
  };

  const handleUpdate = () => {
    fetchCompletedFasts();
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
          Tap a highlighted day to view or edit details
        </p>
      </div>
      
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && handleDateClick(date)}
        modifiers={modifiers}
        showOutsideDays={true}
        className="p-3 rounded-xl border border-border"
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100 cursor-pointer"),
          day_range_end: "day-range-end",
          day_selected: "bg-transparent text-foreground",
          day_today: "bg-muted/50 text-foreground rounded-full",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_hidden: "invisible",
        }}
        modifiersClassNames={{
          completed: "fasting-completed-day",
        }}
        modifiersStyles={{
          completed: {
            background: "linear-gradient(135deg, #22C55E, #12AFCB)",
            borderRadius: "50%",
            position: "relative",
          },
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          DayContent: ({ date }) => {
            const isCompleted = isCompletedDate(date);
            if (isCompleted) {
              return (
                <div className="relative w-full h-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #22C55E, #12AFCB)",
                      padding: "2px",
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      <span className="text-foreground font-medium">{date.getDate()}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return <span>{date.getDate()}</span>;
          },
        }}
      />

      {selectedDate && isCompletedDate(selectedDate) && !isModalOpen && (
        <div 
          className="mt-4 p-4 rounded-xl bg-[#12AFCB]/10 border border-[#12AFCB]/20 cursor-pointer hover:bg-[#12AFCB]/15 transition-colors"
          onClick={() => handleDateClick(selectedDate)}
        >
          <p className="text-sm font-medium text-[#12AFCB]">
            ✓ Fasting goal achieved on {format(selectedDate, "MMMM d, yyyy")} — Tap to edit
          </p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedFast && (
            <FastingHistoryModal
              fastingWindow={selectedFast}
              onClose={handleModalClose}
              onUpdate={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
