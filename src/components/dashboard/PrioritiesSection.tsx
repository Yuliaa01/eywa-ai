import { Target, Calendar, Plus, Zap, MapPin } from "lucide-react";
import { GoalModal } from "@/components/modals/GoalModal";
import { GoalActions } from "@/components/priorities/GoalActions";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { AISuggestionsPanel } from "@/components/priorities/AISuggestionsPanel";
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
    <div className="space-y-6">
      {/* Goals & Wishes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Global Goals */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Global Goals</h3>
            <button 
              onClick={() => openModal('global')}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="space-y-6">
            {globalGoals.length === 0 ? (
              <p className="text-sm text-[#5A6B7F]">No global goals yet. Click + to add one.</p>
            ) : (
              globalGoals.map((goal) => (
                <div key={goal.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-[#12AFCB]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-rounded font-semibold text-[#0E1012]">{goal.title}</h4>
                      </div>
                    </div>
                    <GoalActions 
                      onEdit={() => handleEdit(goal)} 
                      onDelete={() => handleDeleteClick(goal)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Temporary Goals */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Today & This Week</h3>
            <button 
              onClick={() => openModal('temporary')}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="space-y-5">
            {temporaryGoals.length === 0 ? (
              <p className="text-sm text-[#5A6B7F]">No daily/weekly goals yet. Click + to add one.</p>
            ) : (
              temporaryGoals.map((goal) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Zap className="w-5 h-5 text-[#12AFCB]" />
                      <h4 className="font-rounded font-medium text-[#0E1012]">{goal.title}</h4>
                      <span className="text-xs text-[#5A6B7F]">
                        {goal.time_scope === 'day' ? 'Today' : 'This Week'}
                      </span>
                    </div>
                    <GoalActions 
                      onEdit={() => handleEdit(goal)} 
                      onDelete={() => handleDeleteClick(goal)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">
            Plans (Trips & Events)
          </h3>
          <button 
            onClick={() => openModal('plan')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 text-[#12AFCB] font-rounded font-medium text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {plans.length === 0 ? (
            <p className="text-sm text-[#5A6B7F] col-span-2">No plans yet. Click "Add Plan" to create one.</p>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-[#12AFCB] mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{plan.title}</h4>
                    <p className="text-sm text-[#5A6B7F] flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {plan.start_date && plan.end_date && 
                        `${new Date(plan.start_date).toLocaleDateString()} - ${new Date(plan.end_date).toLocaleDateString()}`
                      }
                    </p>
                    {plan.description && (
                      <p className="text-sm text-[#5A6B7F] mt-2">{plan.description}</p>
                    )}
                  </div>
                  <GoalActions 
                    onEdit={() => handleEdit(plan)} 
                    onDelete={() => handleDeleteClick(plan)} 
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <AISuggestionsPanel />

      <GoalModal 
        open={goalModalOpen} 
        onOpenChange={setGoalModalOpen}
        mode={goalMode}
        editMode={editMode}
        initialValues={editingGoal ? {
          id: editingGoal.id,
          title: editingGoal.title,
          description: editingGoal.description || '',
          start_date: editingGoal.start_date || '',
          end_date: editingGoal.end_date || '',
          location_name: editingGoal.location_name || '',
          time_scope: editingGoal.time_scope,
        } : undefined}
        onSuccess={loadGoals}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={deletingGoal?.title || ''}
      />
    </div>
  );
}
