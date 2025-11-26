import { GoalModal } from "@/components/modals/GoalModal";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
import { GoalActions } from "@/components/priorities/GoalActions";
import { useState, useEffect } from "react";
import { fetchActivePriorities, deletePriority, restorePriority, Priority } from "@/api/priorities";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { SortableItem } from '@/components/ui/sortable-item';
import { Target, Calendar, MapPin, Plus, TrendingUp } from "lucide-react";


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

  // Separate today and this week goals
  const todayGoals = temporaryGoals.filter(g => g.time_scope === 'day');
  const weekGoals = temporaryGoals.filter(g => g.time_scope === 'week');

  // Drag and drop hooks for each card type
  const {
    orderedItems: orderedGlobalGoals,
    sensors: globalSensors,
    handleDragEnd: handleGlobalDragEnd,
    sortingStrategy: globalSortingStrategy,
    itemIds: globalIds,
  } = useDragAndDrop({
    items: globalGoals,
    storageKey: 'priorities-global-goals-order',
    idExtractor: (item) => item.id,
  });

  const {
    orderedItems: orderedTodayGoals,
    sensors: todaySensors,
    handleDragEnd: handleTodayDragEnd,
    sortingStrategy: todaySortingStrategy,
    itemIds: todayIds,
  } = useDragAndDrop({
    items: todayGoals,
    storageKey: 'priorities-today-goals-order',
    idExtractor: (item) => item.id,
  });

  const {
    orderedItems: orderedWeekGoals,
    sensors: weekSensors,
    handleDragEnd: handleWeekDragEnd,
    sortingStrategy: weekSortingStrategy,
    itemIds: weekIds,
  } = useDragAndDrop({
    items: weekGoals,
    storageKey: 'priorities-week-goals-order',
    idExtractor: (item) => item.id,
  });

  const {
    orderedItems: orderedPlans,
    sensors: plansSensors,
    handleDragEnd: handlePlansDragEnd,
    sortingStrategy: plansSortingStrategy,
    itemIds: plansIds,
  } = useDragAndDrop({
    items: plans,
    storageKey: 'priorities-plans-order',
    idExtractor: (item) => item.id,
  });

  // Card-level drag and drop for reordering cards in column 2
  type CardType = 'global-goals' | 'today' | 'this-week' | 'plans';
  const defaultCardOrder: CardType[] = ['global-goals', 'today', 'this-week', 'plans'];
  
  const {
    orderedItems: orderedCards,
    sensors: cardSensors,
    handleDragEnd: handleCardDragEnd,
    itemIds: cardIds,
  } = useDragAndDrop({
    items: defaultCardOrder,
    storageKey: 'priorities-cards-order',
    idExtractor: (item) => item,
  });

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
      
      const filteredGlobals = globals.filter(g => g.type === 'global_goal');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const filteredTemps = temps.filter(g => {
        if (g.type !== 'temporary_goal') return false;
        if (!g.time_scope || (g.time_scope !== 'day' && g.time_scope !== 'week')) return false;
        
        if (g.time_scope === 'day') {
          return g.start_date === todayStr;
        }
        
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
        description: "Goal has been removed",
        action: (
          <button 
            onClick={handleUndo}
            className="text-xs font-medium text-accent-teal hover:text-accent-teal/80"
          >
            Undo
          </button>
        ),
      });
      
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async () => {
    if (!deletingGoal) return;

    try {
      await restorePriority(deletingGoal.id);
      setDeletingGoal(null);
      
      toast({
        title: "Goal restored",
        description: "Goal has been restored",
      });
      
      await loadGoals();
    } catch (error) {
      console.error('Error restoring goal:', error);
      toast({
        title: "Error",
        description: "Failed to restore goal",
        variant: "destructive",
      });
    }
  };

  // Card rendering functions
  const renderGlobalGoalsCard = () => (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[222px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl font-bold text-[#0E1012]">Longevity Goals</h3>
        <button
          onClick={() => openModal('global')}
          className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-[#12AFCB]" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {globalGoals.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0E1012] line-clamp-2">Cellular Health (Lower stress)</p>
                <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0E1012] line-clamp-2">Vitality (Daily movement)</p>
                <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500"
                    style={{ width: '45%' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0E1012] line-clamp-2">Cognitive Boost</p>
                <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500"
                    style={{ width: '80%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={globalSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGlobalDragEnd}
          >
            <SortableContext items={globalIds} strategy={globalSortingStrategy}>
              {orderedGlobalGoals.slice(0, 3).map((goal) => (
                <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div 
                    className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(goal)}>
                      <p className="text-sm font-medium text-[#0E1012] line-clamp-2">{goal.title}</p>
                      <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500"
                          style={{ width: `${Math.random() * 40 + 40}%` }}
                        />
                      </div>
                    </div>
                    <GoalActions 
                      onEdit={() => handleEdit(goal)}
                      onDelete={() => handleDeleteClick(goal)}
                    />
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  const renderTodayCard = () => (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[160px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#12AFCB]" />
        <h3 className="font-rounded text-xl font-bold text-[#0E1012]">Well-being Path</h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {todayGoals.length === 0 ? (
          <div className="text-sm text-[#5A6B7F] space-y-2">
            <p>• Focus — recovery</p>
            <p>• Breathing and light training</p>
          </div>
        ) : (
          <DndContext
            sensors={todaySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleTodayDragEnd}
          >
            <SortableContext items={todayIds} strategy={todaySortingStrategy}>
              {orderedTodayGoals.map((goal) => (
                <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div 
                    className="flex items-start gap-3 cursor-pointer hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleEdit(goal)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <p className="text-sm font-medium text-[#0E1012] line-clamp-2 flex-1">{goal.title}</p>
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  const renderThisWeekCard = () => (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[180px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
        <h3 className="font-rounded text-xl font-bold text-[#0E1012]">This Week</h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {weekGoals.length === 0 ? (
          <div className="text-sm text-[#5A6B7F] space-y-2">
            <p>• Build — conditioning</p>
            <p>• 3x strength sessions</p>
            <p>• Morning walks daily</p>
          </div>
        ) : (
          <DndContext
            sensors={weekSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleWeekDragEnd}
          >
            <SortableContext items={weekIds} strategy={weekSortingStrategy}>
              {orderedWeekGoals.map((goal) => (
                <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div 
                    className="flex items-start gap-3 cursor-pointer hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleEdit(goal)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <p className="text-sm font-medium text-[#0E1012] line-clamp-2 flex-1">{goal.title}</p>
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  const renderPlansCard = () => (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[150px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl font-bold text-[#0E1012]">Plans</h3>
        <button
          onClick={() => openModal('plan')}
          className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-[#12AFCB]" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {plans.length === 0 ? (
          <p className="text-sm text-[#5A6B7F]">No plans yet</p>
        ) : (
          <DndContext
            sensors={plansSensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePlansDragEnd}
          >
            <SortableContext items={plansIds} strategy={plansSortingStrategy}>
              {orderedPlans.slice(0, 2).map((plan) => (
                <SortableItem key={plan.id} id={plan.id} showHandle={false}>
                  <div 
                    className="flex items-start gap-3 cursor-pointer hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleEdit(plan)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0E1012] line-clamp-1">{plan.title}</p>
                      {plan.location_name && (
                        <p className="text-xs text-[#5A6B7F] mt-1 line-clamp-1">{plan.location_name}</p>
                      )}
                    </div>
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  const getCardRenderer = (cardType: CardType) => {
    switch (cardType) {
      case 'global-goals':
        return renderGlobalGoalsCard();
      case 'today':
        return renderTodayCard();
      case 'this-week':
        return renderThisWeekCard();
      case 'plans':
        return renderPlansCard();
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Grid layout with fixed AI Chat height */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 w-full">
        {/* AI Chat Center - Column 1, Fixed height */}
        <div className="lg:h-[760px]">
          <AIChatCenter />
        </div>

        {/* Column 2 Cards - Draggable and reorderable, same height as AI Chat */}
        <div className="space-y-4 lg:h-[760px]">
          <DndContext
            sensors={cardSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCardDragEnd}
          >
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
              {orderedCards.map((cardType) => (
                <SortableItem key={cardType} id={cardType}>
                  {getCardRenderer(cardType)}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        mode={goalMode}
        editMode={editMode}
        initialValues={editingGoal || undefined}
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
