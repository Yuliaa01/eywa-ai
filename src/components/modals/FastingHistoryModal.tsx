import { useState } from "react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, Timer, Flame, Zap, Sparkles, Edit2, Trash2, Save, X, CalendarDays } from "lucide-react";
import { toast } from "sonner";

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

interface FastingHistoryModalProps {
  fastingWindow: FastingWindow;
  onClose: () => void;
  onUpdate: () => void;
}

const FASTING_STAGES = [
  { hours: 0, label: "Start", icon: "🏁" },
  { hours: 4, label: "Blood Sugar Stable", icon: "📊" },
  { hours: 12, label: "Ketones Begin", icon: "⚡" },
  { hours: 16, label: "Fat Burning", icon: "🔥" },
  { hours: 18, label: "Autophagy", icon: "🧬" },
  { hours: 24, label: "Deep Ketosis", icon: "💫" },
];

const PROTOCOLS = ["16:8", "18:6", "20:4", "24:0", "OMAD"];

export function FastingHistoryModal({ fastingWindow, onClose, onUpdate }: FastingHistoryModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit form state
  const [editStartAt, setEditStartAt] = useState(
    format(new Date(fastingWindow.start_at), "yyyy-MM-dd'T'HH:mm")
  );
  const [editEndAt, setEditEndAt] = useState(
    fastingWindow.actual_end_at 
      ? format(new Date(fastingWindow.actual_end_at), "yyyy-MM-dd'T'HH:mm")
      : ""
  );
  const [editProtocol, setEditProtocol] = useState(fastingWindow.protocol || "16:8");
  const [editNotes, setEditNotes] = useState(fastingWindow.notes || "");

  // Calculate duration
  const startTime = new Date(fastingWindow.start_at);
  const endTime = fastingWindow.actual_end_at ? new Date(fastingWindow.actual_end_at) : null;
  const durationMinutes = endTime ? differenceInMinutes(endTime, startTime) : 0;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  // Calculate stages reached
  const hoursElapsed = endTime ? differenceInHours(endTime, startTime) : 0;
  const stagesReached = FASTING_STAGES.filter(stage => hoursElapsed >= stage.hours);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("fasting_windows")
        .update({
          start_at: new Date(editStartAt).toISOString(),
          actual_end_at: editEndAt ? new Date(editEndAt).toISOString() : null,
          protocol: editProtocol,
          notes: editNotes || null,
        })
        .eq("id", fastingWindow.id);

      if (error) throw error;

      toast.success("Fasting record updated");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating fasting window:", error);
      toast.error("Failed to update fasting record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Delete associated logs first (foreign key constraint)
      await supabase
        .from("fasting_logs")
        .delete()
        .eq("fasting_window_id", fastingWindow.id);

      // Then delete the fasting window
      const { error } = await supabase
        .from("fasting_windows")
        .delete()
        .eq("id", fastingWindow.id);

      if (error) throw error;

      toast.success("Fasting record deleted");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting fasting window:", error);
      toast.error("Failed to delete fasting record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#12AFCB]/10 text-[#12AFCB] border-[#12AFCB]/20">
              <CalendarDays className="w-3 h-3 mr-1" />
              Fasting Record
            </Badge>
            <Badge variant="outline">{fastingWindow.protocol || "16:8"}</Badge>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {format(startTime, "EEEE, MMMM d, yyyy")}
          </h2>
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-[#12AFCB]"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator />

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={editStartAt}
                onChange={(e) => setEditStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={editEndAt}
                onChange={(e) => setEditEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <Select value={editProtocol} onValueChange={setEditProtocol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROTOCOLS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this fast..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-[#12AFCB] hover:bg-[#12AFCB]/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          {/* Duration */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <div className="p-2 rounded-lg bg-[#12AFCB]/10">
              <Timer className="w-5 h-5 text-[#12AFCB]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="text-lg font-semibold text-foreground">
                {durationHours}h {durationMins}m
              </p>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-muted-foreground">Started</span>
              </div>
              <p className="font-medium text-foreground">
                {format(startTime, "h:mm a")}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-[#22C55E]" />
                <span className="text-sm text-muted-foreground">Ended</span>
              </div>
              <p className="font-medium text-foreground">
                {endTime ? format(endTime, "h:mm a") : "—"}
              </p>
            </div>
          </div>

          {/* Stages Reached */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Metabolic Stages Reached</p>
            <div className="flex flex-wrap gap-2">
              {FASTING_STAGES.map((stage) => {
                const reached = hoursElapsed >= stage.hours;
                return (
                  <Badge
                    key={stage.hours}
                    variant={reached ? "default" : "outline"}
                    className={reached 
                      ? "bg-[#12AFCB]/10 text-[#12AFCB] border-[#12AFCB]/20" 
                      : "opacity-50"
                    }
                  >
                    <span className="mr-1">{stage.icon}</span>
                    {stage.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {fastingWindow.notes && (
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-foreground">{fastingWindow.notes}</p>
            </div>
          )}

          <Separator />

          {/* Delete Section */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete This Record
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Fasting Record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this fasting record and all associated logs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
