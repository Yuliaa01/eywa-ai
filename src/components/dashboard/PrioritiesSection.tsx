import { GoalModal } from "@/components/modals/GoalModal";
import { DeleteConfirmDialog } from "@/components/priorities/DeleteConfirmDialog";
import { AIChatCenter } from "@/components/priorities/AIChatCenter";
import { GoalActions } from "@/components/priorities/GoalActions";
import { HealthIndicatorModal } from "@/components/modals/HealthIndicatorModal";
import { useState, useEffect, useMemo } from "react";
import { fetchActivePriorities, deletePriority, restorePriority, Priority } from "@/api/priorities";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { SortableItem } from '@/components/ui/sortable-item';
import { Target, Calendar, MapPin, Plus, TrendingUp, Heart, Activity, User, ArrowUpRight, ChevronRight, Brain, Moon, Apple, Dumbbell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBioAge } from "@/hooks/useBioAge";
export default function PrioritiesSection() {
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<'global' | 'temporary' | 'plan'>('global');
  const [editMode, setEditMode] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Priority | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Priority | null>(null);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<"bio-age" | "health-score" | "vitals" | null>(null);
  const [globalGoals, setGlobalGoals] = useState<Priority[]>([]);
  const [temporaryGoals, setTemporaryGoals] = useState<Priority[]>([]);
  const [plans, setPlans] = useState<Priority[]>([]);
  const {
    chronologicalAge: actualAge,
    biologicalAge: bioAge
  } = useBioAge();
  const {
    toast
  } = useToast();

  // Separate today and this week goals
  const todayGoals = temporaryGoals.filter(g => g.time_scope === 'day');
  const weekGoals = temporaryGoals.filter(g => g.time_scope === 'week');

  // Drag and drop hooks for each card type
  const {
    orderedItems: orderedGlobalGoals,
    sensors: globalSensors,
    handleDragEnd: handleGlobalDragEnd,
    sortingStrategy: globalSortingStrategy,
    itemIds: globalIds
  } = useDragAndDrop({
    items: globalGoals,
    storageKey: 'priorities-global-goals-order',
    idExtractor: item => item.id
  });
  const {
    orderedItems: orderedTodayGoals,
    sensors: todaySensors,
    handleDragEnd: handleTodayDragEnd,
    sortingStrategy: todaySortingStrategy,
    itemIds: todayIds
  } = useDragAndDrop({
    items: todayGoals,
    storageKey: 'priorities-today-goals-order',
    idExtractor: item => item.id
  });
  const {
    orderedItems: orderedWeekGoals,
    sensors: weekSensors,
    handleDragEnd: handleWeekDragEnd,
    sortingStrategy: weekSortingStrategy,
    itemIds: weekIds
  } = useDragAndDrop({
    items: weekGoals,
    storageKey: 'priorities-week-goals-order',
    idExtractor: item => item.id
  });
  const {
    orderedItems: orderedPlans,
    sensors: plansSensors,
    handleDragEnd: handlePlansDragEnd,
    sortingStrategy: plansSortingStrategy,
    itemIds: plansIds
  } = useDragAndDrop({
    items: plans,
    storageKey: 'priorities-plans-order',
    idExtractor: item => item.id
  });

  // Card-level drag and drop for reordering cards in column 2
  type CardType = 'global-goals' | 'today' | 'week-plans-row' | 'longevity-insights';
  const cardItems = useMemo<CardType[]>(() => ['global-goals', 'today', 'week-plans-row', 'longevity-insights'], []);
  const {
    orderedItems: orderedCards,
    sensors: cardSensors,
    handleDragEnd: handleCardDragEnd,
    itemIds: cardIds
  } = useDragAndDrop({
    items: cardItems,
    storageKey: 'priorities-cards-order',
    idExtractor: item => item
  });
  useEffect(() => {
    loadGoals();
  }, []);
  const loadGoals = async () => {
    try {
      const [globals, temps, planData] = await Promise.all([fetchActivePriorities('global_goal'), fetchActivePriorities('temporary_goal'), Promise.all([fetchActivePriorities('plan_trip'), fetchActivePriorities('plan_event')]).then(([trips, events]) => [...trips, ...events])]);
      const filteredGlobals = globals.filter(g => g.type === 'global_goal');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      const filteredTemps = temps.filter(g => {
        if (g.type !== 'temporary_goal') return false;
        if (!g.time_scope || g.time_scope !== 'day' && g.time_scope !== 'week') return false;
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
    if (goal.type === 'global_goal') setGoalMode('global');else if (goal.type === 'temporary_goal') setGoalMode('temporary');else setGoalMode('plan');
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
        action: <button onClick={handleUndo} className="text-xs font-medium text-accent-teal hover:text-accent-teal/80">
            Undo
          </button>
      });
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive"
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
        description: "Goal has been restored"
      });
      await loadGoals();
    } catch (error) {
      console.error('Error restoring goal:', error);
      toast({
        title: "Error",
        description: "Failed to restore goal",
        variant: "destructive"
      });
    }
  };

  // Card rendering functions
  const renderGlobalGoalsCard = () => <div className="relative rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[222px] flex flex-col py-[20px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl text-[#0E1012] font-semibold">Longevity Goals</h3>
        <button onClick={() => openModal('global')} className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200">
          <Plus className="w-4 h-4 text-[#12AFCB]" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {globalGoals.length === 0 ? <div className="space-y-3">
            <div className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0E1012] line-clamp-2">Cellular Health (Lower stress)</p>
                <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                width: '65%'
              }} />
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
                  <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                width: '45%'
              }} />
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
                  <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                width: '80%'
              }} />
                </div>
              </div>
            </div>
          </div> : <DndContext sensors={globalSensors} collisionDetection={closestCenter} onDragEnd={handleGlobalDragEnd}>
            <SortableContext items={globalIds} strategy={globalSortingStrategy}>
              {orderedGlobalGoals.slice(0, 3).map(goal => <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div className="flex items-start gap-3 hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleEdit(goal)}>
                      <p className="text-sm font-medium text-[#0E1012] line-clamp-2">{goal.title}</p>
                      <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                    width: `${Math.random() * 40 + 40}%`
                  }} />
                      </div>
                    </div>
                    <GoalActions onEdit={() => handleEdit(goal)} onDelete={() => handleDeleteClick(goal)} />
                  </div>
                </SortableItem>)}
            </SortableContext>
          </DndContext>}
      </div>
      {/* Drag handle dots at bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
      </div>
    </div>;
  const renderTodayCard = () => <div className="relative rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[160px] flex flex-col py-[20px]">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#12AFCB]" />
        <h3 className="font-rounded text-xl text-[#0E1012] font-semibold">Well-being Path</h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {todayGoals.length === 0 ? <div className="text-sm text-[#5A6B7F] space-y-2">
            <p>• Focus — recovery</p>
            <p>• Breathing and light training</p>
          </div> : <DndContext sensors={todaySensors} collisionDetection={closestCenter} onDragEnd={handleTodayDragEnd}>
            <SortableContext items={todayIds} strategy={todaySortingStrategy}>
               {orderedTodayGoals.map(goal => <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div className="flex items-start gap-3 cursor-pointer hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors" onClick={() => handleEdit(goal)}>
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0E1012] line-clamp-2">{goal.title}</p>
                      <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                          width: `${Math.random() * 30 + 50}%`
                        }} />
                      </div>
                    </div>
                  </div>
                </SortableItem>)}
            </SortableContext>
          </DndContext>}
      </div>
      {/* Drag handle dots at bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
      </div>
    </div>;
  const renderThisWeekCard = () => <div className="relative rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[180px] flex flex-col py-[20px]">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
        <h3 className="font-rounded text-xl text-[#0E1012] font-semibold">This Week</h3>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3">
        {weekGoals.length === 0 ? <div className="text-sm text-[#5A6B7F] space-y-2">
            <p>• Build — conditioning</p>
            <p>• 3x strength sessions</p>
            <p>• Morning walks daily</p>
          </div> : <DndContext sensors={weekSensors} collisionDetection={closestCenter} onDragEnd={handleWeekDragEnd}>
            <SortableContext items={weekIds} strategy={weekSortingStrategy}>
               {orderedWeekGoals.map(goal => <SortableItem key={goal.id} id={goal.id} showHandle={false}>
                  <div className="flex items-start gap-3 cursor-pointer hover:bg-[#12AFCB]/5 rounded-lg p-2 -m-2 transition-colors" onClick={() => handleEdit(goal)}>
                    <div className="w-8 h-8 rounded-lg bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-[#12AFCB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0E1012] line-clamp-2">{goal.title}</p>
                      <div className="mt-2 h-1.5 bg-[#12AFCB]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] rounded-full transition-all duration-500" style={{
                          width: `${Math.random() * 30 + 50}%`
                        }} />
                      </div>
                    </div>
                  </div>
                </SortableItem>)}
            </SortableContext>
          </DndContext>}
      </div>
      {/* Drag handle dots at bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
      </div>
    </div>;
  const renderPlansCard = () => <div className="relative rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 h-[180px] overflow-hidden flex flex-col py-[20px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl text-[#0E1012] font-semibold">Plans</h3>
        <button onClick={() => openModal('plan')} className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200">
          <Plus className="w-4 h-4 text-[#12AFCB]" />
        </button>
      </div>
      <DndContext sensors={plansSensors} collisionDetection={closestCenter} onDragEnd={handlePlansDragEnd}>
        <SortableContext items={plansIds} strategy={plansSortingStrategy}>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {plans.length === 0 ? <div className="rounded-2xl bg-[#12AFCB]/10 backdrop-blur-sm border border-[#12AFCB]/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <MapPin className="w-5 h-5 text-[#12AFCB] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#0E1012]">Porto Wellness Retreat</p>
                    <p className="text-xs text-[#5A6B7F]">Porto</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#5A6B7F] flex-shrink-0" />
              </div> : orderedPlans.map(plan => <SortableItem key={plan.id} id={plan.id} showHandle={false}>
                  <div onClick={() => handleEdit(plan)} className="rounded-2xl bg-[#12AFCB]/10 backdrop-blur-sm border border-[#12AFCB]/20 p-4 hover:bg-[#12AFCB]/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mb-2">
                      <MapPin className="w-5 h-5 text-[#12AFCB] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0E1012] truncate">
                          {plan.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#5A6B7F]">
                          {plan.location_name && <span>{plan.location_name}</span>}
                          {plan.location_name && plan.start_date && <span>•</span>}
                          {plan.start_date && <span>{new Date(plan.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>}
                        </div>
                      </div>
                    </div>
                    {plan.start_date && (() => {
                      const daysLeft = Math.ceil((new Date(plan.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <span className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Today!' : 'Past event'}
                        </span>
                      );
                    })()}
                  </div>
                </SortableItem>)}
          </div>
        </SortableContext>
      </DndContext>
      {/* Drag handle dots at bottom */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
      </div>
    </div>;
  const renderLongevityInsightsCard = () => <div className="relative rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-6 flex-1 flex flex-col py-[20px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rounded text-xl text-[#0E1012] font-semibold">Longevity Insights</h3>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 flex items-center justify-center transition-all duration-200">
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedIndicator("bio-age");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <User className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Bio-Age Analysis</span>
              </button>
              <button
                onClick={() => {
                  setSelectedIndicator("health-score");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <Heart className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Health Score</span>
              </button>
              <button
                onClick={() => {
                  setSelectedIndicator("vitals");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <Activity className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Key Vitals</span>
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => {
                  setSelectedIndicator("vitals");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <Moon className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Sleep Insight</span>
              </button>
              <button
                onClick={() => {
                  setSelectedIndicator("vitals");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <Dumbbell className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Training Insight</span>
              </button>
              <button
                onClick={() => {
                  setSelectedIndicator("vitals");
                  setIndicatorModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#12AFCB]/10 transition-colors text-left"
              >
                <Apple className="w-4 h-4 text-[#12AFCB]" />
                <span className="text-sm text-foreground">Nutrition Insight</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-3 gap-4 flex-1 content-start">
        {/* Bio-Age Column */}
        <button 
          onClick={() => {
            setSelectedIndicator("bio-age");
            setIndicatorModalOpen(true);
          }}
          className="flex items-center gap-3 hover:bg-[#12AFCB]/5 rounded-xl p-2 -m-2 transition-all duration-200 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#12AFCB]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-[#0E1012]">
                Bio-Age: {bioAge !== null ? bioAge : actualAge !== null ? actualAge : '—'}
              </p>
              {bioAge !== null && actualAge !== null && bioAge < actualAge && <ArrowUpRight className="w-3 h-3 text-[#12AFCB]" />}
            </div>
            <p className="text-xs text-[#5A6B7F]">
              (Actual {actualAge !== null ? actualAge : '—'})
            </p>
          </div>
        </button>

        {/* Health Score Column */}
        <button 
          onClick={() => {
            setSelectedIndicator("health-score");
            setIndicatorModalOpen(true);
          }}
          className="flex items-center gap-3 hover:bg-[#12AFCB]/5 rounded-xl p-2 -m-2 transition-all duration-200 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-[#12AFCB]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-[#0E1012]">88/100</p>
              <ArrowUpRight className="w-3 h-3 text-[#12AFCB]" />
            </div>
            <p className="text-xs text-[#5A6B7F]">Health Score</p>
          </div>
        </button>

        {/* Key Vitals Column */}
        <button 
          onClick={() => {
            setSelectedIndicator("vitals");
            setIndicatorModalOpen(true);
          }}
          className="flex items-center gap-3 hover:bg-[#12AFCB]/5 rounded-xl p-2 -m-2 transition-all duration-200 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-[#12AFCB]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0E1012]">Key Vitals</p>
            <p className="text-xs text-[#5A6B7F]">HR, HRV, BP, BMI</p>
          </div>
        </button>
      </div>
      {/* Drag handle dots at bottom */}
      <div className="mt-auto pt-4 flex justify-center gap-1">
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]"></div>
      </div>
    </div>;
  const renderWeekPlansRow = () => {
    return <div className="grid grid-cols-2 gap-4">
        {renderThisWeekCard()}
        {renderPlansCard()}
      </div>;
  };
  const getCardRenderer = (cardType: CardType) => {
    switch (cardType) {
      case 'global-goals':
        return renderGlobalGoalsCard();
      case 'today':
        return renderTodayCard();
      case 'week-plans-row':
        return renderWeekPlansRow();
      case 'longevity-insights':
        return renderLongevityInsightsCard();
      default:
        return null;
    }
  };
  return <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Grid layout with fixed AI Chat height */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 w-full lg:items-start">
        {/* AI Chat Center - Column 1, Fixed height */}
        <div className="lg:h-[760px] flex flex-col">
          <AIChatCenter />
        </div>

        {/* Column 2 Cards - Draggable with side-by-side This Week and Plans */}
        <div className="flex flex-col gap-4 lg:h-[760px]">
          <DndContext sensors={cardSensors} collisionDetection={closestCenter} onDragEnd={handleCardDragEnd}>
            <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
              {orderedCards.map(cardType => <SortableItem key={cardType} id={cardType} showHandle={false}>
                  {getCardRenderer(cardType)}
                </SortableItem>)}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <GoalModal open={goalModalOpen} onOpenChange={setGoalModalOpen} mode={goalMode} editMode={editMode} initialValues={editingGoal || undefined} onSuccess={loadGoals} />

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} title={deletingGoal?.title || ''} />
      
      <HealthIndicatorModal
        open={indicatorModalOpen}
        onOpenChange={setIndicatorModalOpen}
        indicatorType={selectedIndicator}
        bioAge={bioAge}
        actualAge={actualAge}
      />
    </div>;
}