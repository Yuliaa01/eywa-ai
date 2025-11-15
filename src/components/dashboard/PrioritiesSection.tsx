import { GoalModal } from "@/components/modals/GoalModal";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
import { SmartCards } from "@/components/priorities/SmartCards";
import { useState, useEffect } from "react";
import { fetchActivePriorities, deletePriority, restorePriority, Priority } from "@/api/priorities";
import { useToast } from "@/hooks/use-toast";

export default function PrioritiesSection() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<'global' | 'temporary' | 'plan'>('global');
  const [editMode, setEditMode] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Priority | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Priority | null>(null);
  const [globalGoals, setGlobalGoals] = useState<Priority[]>([]);
  const [temporaryGoals, setTemporaryGoals] = useState<Priority[]>([]);
  const [plans, setPlans] = useState<Priority[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const [globals, temps, planData] = await Promise.all([
        fetchActivePriorities('global_goal'),
        fetchActivePriorities('temporary_goal'),
        Promise.all([
          fetchActivePriorities('plan_trip'),
          fetchActivePriorities('plan_event'),
        ]).then(([trips, events]) => [...trips, ...events]),
      ]);
      
      // Filter global goals: only global_goal type
      const filteredGlobals = globals.filter(g => g.type === 'global_goal');
      
      // Filter temporary goals: only temporary_goal with day/week scope and valid dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const filteredTemps = temps.filter(g => {
        if (g.type !== 'temporary_goal') return false;
        if (!g.time_scope || (g.time_scope !== 'day' && g.time_scope !== 'week')) return false;
        
        // Day scope: must match today
        if (g.time_scope === 'day') {
          return g.start_date === todayStr;
        }
        
        // Week scope: today must be between start and end
        if (g.time_scope === 'week' && g.start_date && g.end_date) {
          const startDate = new Date(g.start_date);
          const endDate = new Date(g.end_date);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return today >= startDate && today <= endDate;
        }
        
        return false;
      });
      
      setGlobalGoals(filteredGlobals);
      setTemporaryGoals(filteredTemps);
      setPlans(planData);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const openModal = (mode: 'global' | 'temporary' | 'plan') => {
    setGoalMode(mode);
    setEditMode(false);
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  const handleEdit = (goal: Priority) => {
    setEditMode(true);
    setEditingGoal(goal);
    if (goal.type === 'global_goal') setGoalMode('global');
    else if (goal.type === 'temporary_goal') setGoalMode('temporary');
    else setGoalMode('plan');
    setGoalModalOpen(true);
  };

  const handleDeleteClick = (goal: Priority) => {
    setDeletingGoal(goal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;

    try {
      await deletePriority(deletingGoal.id);
      setDeleteDialogOpen(false);
      
      toast({
        title: "Goal deleted",
        description: deletingGoal.title,
        action: (
          <button
            onClick={() => handleUndo(deletingGoal.id)}
            className="px-3 py-1 text-sm font-medium text-[#12AFCB] hover:text-[#19D0E4]"
          >
            Undo
          </button>
        ),
        duration: 10000,
      });
      
      loadGoals();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await restorePriority(id);
      toast({
        title: "Goal restored",
      });
      loadGoals();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore goal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Layout: AI Chat (Left) + Smart Cards (Right) */}
      <div className="grid lg:grid-cols-[1.5fr,1fr] gap-6 flex-1 overflow-hidden">
        {/* Left Column - AI Chat Center */}
        <div className="h-full overflow-hidden flex items-stretch">
          <AIChatCenter />
        </div>

        {/* Right Column - Smart Cards */}
        <div className="h-full overflow-hidden flex items-stretch">
          <SmartCards
          globalGoals={globalGoals}
          temporaryGoals={temporaryGoals}
          plans={plans}
          onAddGlobal={() => openModal('global')}
          onAddPlan={() => openModal('plan')}
        />
        </div>
      </div>

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        mode={goalMode}
        editMode={editMode}
        initialValues={editingGoal ? {
          id: editingGoal.id,
          title: editingGoal.title,
          description: editingGoal.description || "",
          start_date: editingGoal.start_date || "",
          end_date: editingGoal.end_date || "",
          location_name: editingGoal.location_name || "",
          time_scope: editingGoal.time_scope as 'day' | 'week' | undefined,
        } : undefined}
        onSuccess={loadGoals}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingGoal?.title || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
