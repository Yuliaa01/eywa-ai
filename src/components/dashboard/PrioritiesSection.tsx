import { GoalModal } from "@/components/modals/GoalModal";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
import { useState, useEffect } from "react";
import { fetchActivePriorities, deletePriority, restorePriority, Priority } from "@/api/priorities";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { SortableItem } from '@/components/ui/sortable-item';
import { Target, Calendar, MapPin, Plus } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";

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

  // Separate today and this week goals
  const todayGoals = temporaryGoals.filter(g => g.time_scope === 'day');
  const weekGoals = temporaryGoals.filter(g => g.time_scope === 'week');

  // Define all main cards for drag and drop
  const allCards = [
    { id: 'ai-chat', type: 'ai-chat' },
    { id: 'global-goals', type: 'global-goals' },
    { id: 'today', type: 'today' },
    { id: 'this-week', type: 'this-week' },
    { id: 'plans', type: 'plans' },
  ];

  const dragAndDrop = useDragAndDrop({
    items: allCards,
    storageKey: 'priorities-main-cards-order',
    idExtractor: (item) => item.id,
  });

  const renderCard = (card: { id: string; type: string }) => {
    switch (card.type) {
      case 'ai-chat':
        return <AIChatCenter key={card.id} />;
      
      case 'global-goals':
        return (
          <GlassCard key={card.id} className="p-6 h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rounded text-xl font-bold text-foreground">Global Goals</h3>
              <button
                onClick={() => openModal('global')}
                className="w-8 h-8 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 flex items-center justify-center transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-accent-teal" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {globalGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No global goals yet</p>
              ) : (
                globalGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3 cursor-pointer hover:bg-accent/5 p-2 rounded-lg transition-colors" onClick={() => handleEdit(goal)}>
                    <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-accent-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{goal.title}</p>
                      <div className="mt-2 h-1.5 bg-accent-teal/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent-teal to-accent-teal-alt rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );
      
      case 'today':
        return (
          <GlassCard key={card.id} className="p-6 h-[220px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent-teal" />
              <h3 className="font-rounded text-xl font-bold text-foreground">Today</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {todayGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals for today</p>
              ) : (
                todayGoals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3 cursor-pointer hover:bg-accent/5 p-2 rounded-lg transition-colors" onClick={() => handleEdit(goal)}>
                    <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 text-accent-teal" />
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 flex-1">{goal.title}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );
      
      case 'this-week':
        return (
          <GlassCard key={card.id} className="p-6 h-[220px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-accent-teal" />
              <h3 className="font-rounded text-xl font-bold text-foreground">This Week</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {weekGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No goals for this week</p>
              ) : (
                weekGoals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-3 cursor-pointer hover:bg-accent/5 p-2 rounded-lg transition-colors" onClick={() => handleEdit(goal)}>
                    <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-3 h-3 text-accent-teal" />
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 flex-1">{goal.title}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );
      
      case 'plans':
        return (
          <GlassCard key={card.id} className="p-6 h-[240px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rounded text-xl font-bold text-foreground">Plans</h3>
              <button
                onClick={() => openModal('plan')}
                className="w-8 h-8 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 flex items-center justify-center transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-accent-teal" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No plans yet</p>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="flex items-start gap-3 cursor-pointer hover:bg-accent/5 p-2 rounded-lg transition-colors" onClick={() => handleEdit(plan)}>
                    <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-accent-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{plan.title}</p>
                      {plan.location_name && (
                        <p className="text-xs text-muted-foreground truncate">{plan.location_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DndContext
          sensors={dragAndDrop.sensors}
          collisionDetection={closestCenter}
          onDragEnd={dragAndDrop.handleDragEnd}
        >
          <SortableContext
            items={dragAndDrop.itemIds}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dragAndDrop.orderedItems.map((card) => (
                <SortableItem 
                  key={card.id} 
                  id={card.id}
                  className={card.type === 'ai-chat' ? 'lg:row-span-4' : ''}
                >
                  {renderCard(card)}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
