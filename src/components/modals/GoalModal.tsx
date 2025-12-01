import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createPriority, updatePriority } from "@/api/priorities";

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'global' | 'temporary' | 'plan';
  editMode?: boolean;
  initialValues?: {
    id?: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    location_name?: string;
    time_scope?: 'day' | 'week';
    target_value?: number;
    target_metric?: string;
    units?: string;
  };
}

const QUICK_SUGGESTIONS = [
  { label: "Lower stress", title: "Lower stress" },
  { label: "Improve VO₂max", title: "Improve VO₂max" },
  { label: "Better sleep quality", title: "Better sleep quality" },
  { label: "Fasting focus (16:8)", title: "Fasting focus (16:8)" },
  { label: "Hydration target", title: "Hydration target" },
  { label: "Daily steps / movement", title: "Daily steps / movement" },
];

export function GoalModal({ open, onOpenChange, onSuccess, mode = 'global', editMode = false, initialValues }: GoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [timeScope, setTimeScope] = useState<'day' | 'week'>(initialValues?.time_scope || 'day');
  const [formData, setFormData] = useState({
    type: mode === 'global' ? "global_goal" : mode === 'temporary' ? "temporary_goal" : "plan_trip",
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    start_date: initialValues?.start_date || "",
    end_date: initialValues?.end_date || "",
    location_name: initialValues?.location_name || "",
    target_value: "",
    target_metric: "",
    units: "",
  });

  // Update form when modal opens or mode changes
  useEffect(() => {
    if (open) {
      if (initialValues) {
        setFormData({
          type: mode === 'global' ? "global_goal" : mode === 'temporary' ? "temporary_goal" : "plan_trip",
          title: initialValues.title || "",
          description: initialValues.description || "",
          start_date: initialValues.start_date || "",
          end_date: initialValues.end_date || "",
          location_name: initialValues.location_name || "",
          target_value: initialValues.target_value?.toString() || "",
          target_metric: initialValues.target_metric || "",
          units: initialValues.units || "",
        });
        setTimeScope(initialValues.time_scope || 'day');
      } else {
        // Reset form for new goal
        setFormData({
          type: mode === 'global' ? "global_goal" : mode === 'temporary' ? "temporary_goal" : "plan_trip",
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location_name: "",
          target_value: "",
          target_metric: "",
          units: "",
        });
        setTimeScope('day');
      }
    }
  }, [open, initialValues, mode]);

  // Initialize dates when modal opens with temporary mode
  useEffect(() => {
    if (open && mode === 'temporary' && !editMode) {
      updateDatesForScope(timeScope);
    }
  }, [open, mode, editMode]);

  // Auto-set dates when timeScope changes for temporary goals
  const updateDatesForScope = (scope: 'day' | 'week') => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (scope === 'day') {
      setFormData(prev => ({ ...prev, start_date: todayStr, end_date: todayStr }));
    } else {
      // Week: Monday to Sunday
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const sundayStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

      setFormData(prev => ({ ...prev, start_date: mondayStr, end_date: sundayStr }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.title.length < 3) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const saveData: any = {
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location_name: formData.location_name || null,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        target_metric: formData.target_metric || null,
        units: formData.units || null,
        status: "planned",
      };

      // Only add time_scope for temporary goals
      if (mode === 'temporary') {
        saveData.time_scope = timeScope;
      }

      if (editMode && initialValues?.id) {
        await updatePriority(initialValues.id, saveData);
      } else {
        await createPriority(saveData);
      }

      toast({
        title: editMode ? "Goal updated" : (mode === 'global' ? "Global goal created" : mode === 'temporary' ? "Goal added" : "Plan created"),
        description: editMode ? "Your changes have been saved." : (mode === 'global' ? "Your global goal has been added successfully." : mode === 'temporary' ? `Goal added to ${timeScope === 'day' ? 'Today' : 'This Week'}.` : "Your plan has been created."),
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      const newType = mode === 'global' ? "global_goal" : mode === 'temporary' ? "temporary_goal" : "plan_trip";
      setFormData({
        type: newType,
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location_name: "",
        target_value: "",
        target_metric: "",
        units: "",
      });
      setTimeScope('day');
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
      <DialogContent 
        className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-[#12AFCB]/20 animate-scale-in"
        aria-labelledby="goal-modal-title"
      >
        <DialogHeader>
          <DialogTitle id="goal-modal-title" className="text-2xl font-rounded">
            {editMode ? 'Edit Goal' : (mode === 'global' ? 'Add Global Goal' : mode === 'temporary' ? 'Add Today/Week Goal' : 'Add Plan')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label="Goal form">
          {/* Quick Suggestions */}
          {!editMode && mode !== 'plan' && (
            <div className="space-y-2">
              <Label className="text-sm text-[#5A6B7F]">Quick Suggestions</Label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick suggestion chips">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, title: suggestion.title })}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#12AFCB]/10 text-[#12AFCB] hover:bg-[#12AFCB]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    aria-label={`Set title to ${suggestion.label}`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scope Switcher for Temporary Goals */}
          {mode === 'temporary' && (
            <div className="flex gap-2 p-1 bg-[#12AFCB]/5 rounded-xl" role="group" aria-label="Time scope selector">
              <button
                type="button"
                onClick={() => {
                  setTimeScope('day');
                  updateDatesForScope('day');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-rounded font-medium text-sm transition-all duration-200 ${
                  timeScope === 'day'
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)]'
                    : 'text-[#5A6B7F] hover:text-[#12AFCB]'
                }`}
                aria-pressed={timeScope === 'day'}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeScope('week');
                  updateDatesForScope('week');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-rounded font-medium text-sm transition-all duration-200 ${
                  timeScope === 'week'
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)]'
                    : 'text-[#5A6B7F] hover:text-[#12AFCB]'
                }`}
                aria-pressed={timeScope === 'week'}
              >
                This Week
              </button>
            </div>
          )}

          {/* Type Selector for Plan mode */}
          {mode === 'plan' && (
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan_trip">Trip Plan</SelectItem>
                  <SelectItem value="plan_event">Event Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="goal-title">Title *</Label>
            <Input
              id="goal-title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Lower Stress, NYC Trip"
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
              rows={3}
              aria-label="Goal description"
            />
          </div>

          {/* Progress Tracking Fields */}
          {(mode === 'global' || mode === 'temporary') && (
            <div className="space-y-3 p-4 bg-[#12AFCB]/5 rounded-xl border border-[#12AFCB]/10">
              <Label className="text-sm font-semibold text-[#0E1012]">Progress Tracking (Optional)</Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="goal-target-value" className="text-xs">Target Value</Label>
                  <Input
                    id="goal-target-value"
                    type="number"
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    placeholder="e.g., 10000"
                    aria-label="Target value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-units" className="text-xs">Units</Label>
                  <Select
                    value={formData.units}
                    onValueChange={(value) => setFormData({ ...formData, units: value })}
                  >
                    <SelectTrigger id="goal-units">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps">steps</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="hours">hours</SelectItem>
                      <SelectItem value="minutes">minutes</SelectItem>
                      <SelectItem value="km">km</SelectItem>
                      <SelectItem value="miles">miles</SelectItem>
                      <SelectItem value="reps">reps</SelectItem>
                      <SelectItem value="sessions">sessions</SelectItem>
                      <SelectItem value="days">days</SelectItem>
                      <SelectItem value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-metric" className="text-xs">What are you measuring? (Optional)</Label>
                <Input
                  id="goal-metric"
                  value={formData.target_metric}
                  onChange={(e) => setFormData({ ...formData, target_metric: e.target.value })}
                  placeholder="e.g., Daily Steps, Weight Loss, Running Distance"
                  aria-label="Target metric description"
                />
              </div>
            </div>
          )}

          {/* Location field - shown for plan mode only */}
          {mode === 'plan' && (
            <div className="space-y-2">
              <Label htmlFor="goal-location">Location (optional)</Label>
              <Input
                id="goal-location"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="e.g., Central Park, 24/7 Gym, Green Bowl Café"
                aria-label="Location for this goal"
                aria-autocomplete="list"
              />
            </div>
          )}

          {/* Date fields - shown for plan mode only */}
          {mode === 'plan' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-start-date">Start Date</Label>
                <Input
                  id="plan-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  aria-label="Plan start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-end-date">End Date</Label>
                <Input
                  id="plan-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  aria-label="Plan end date"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 hover:bg-[#12AFCB]/10"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] hover:shadow-[0_4px_20px_rgba(18,175,203,0.4)] transition-all duration-200" 
              disabled={loading}
            >
              {loading ? (editMode ? "Saving..." : "Creating...") : (editMode ? "Save Changes" : (mode === 'plan' ? "Create Plan" : "Create Goal"))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
