import { Utensils, Droplet, Clock, MapPin, Plus, ChevronRight, Camera, FileText } from "lucide-react";
import { MealModal } from "@/components/modals/MealModal";
import { SupplementModal } from "@/components/modals/SupplementModal";
import { FastingQuickStart } from "@/components/modals/FastingQuickStart";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import FastingTimer from "./FastingTimer";

export default function NutritionSection() {
  const navigate = useNavigate();
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [photoMealModalOpen, setPhotoMealModalOpen] = useState(false);
  const [supplementModalOpen, setSupplementModalOpen] = useState(false);
  const [fastingModalOpen, setFastingModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('breakfast');
  const [fastingWindow, setFastingWindow] = useState({
    start: "20:00",
    end: "12:00",
    progress: 0,
    type: "16:8",
  });

  const macros = [
    { name: "Carbs", current: 180, target: 250, color: "#19D0E4", unit: "g" },
    { name: "Protein", current: 140, target: 180, color: "#12AFCB", unit: "g" },
    { name: "Fat", current: 65, target: 80, color: "#0E8FA6", unit: "g" },
  ];

  const supplements = [
    { name: "Vitamin D", dosage: "4000 IU", time: "Morning" },
    { name: "Omega-3", dosage: "2g EPA+DHA", time: "With meals" },
    { name: "Magnesium", dosage: "400mg", time: "Evening" },
  ];

  // Fetch active fasting window - using extracted function
  useEffect(() => {
    fetchFastingWindow();
    const interval = setInterval(fetchFastingWindow, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Extracted fetchFastingWindow to avoid duplication
  const fetchFastingWindow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("fasting_windows")
        .select("*")
        .eq("user_id", user.id)
        .gte("end_at", new Date().toISOString())
        .order("start_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const startTime = new Date(data.start_at);
        const endTime = new Date(data.end_at);
        const now = new Date();
        const totalDuration = endTime.getTime() - startTime.getTime();
        const elapsed = now.getTime() - startTime.getTime();
        const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

        setFastingWindow({
          start: startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          end: endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          progress,
          type: data.protocol || "16:8",
        });
      }
    } catch (error) {
      console.error("Error fetching fasting window:", error);
    }
  };

  const handleFastingSuccess = () => {
    fetchFastingWindow();
  };

  const nearbyCafes = [
    {
      name: "Green Bowl Café",
      distance: "0.3 mi",
      match: "95% match",
      tags: ["Vegan", "Keto-friendly"],
    },
    {
      name: "Protein Kitchen",
      distance: "0.5 mi",
      match: "90% match",
      tags: ["High-protein", "Low-carb"],
    },
  ];

  const handleAddMeal = (type: 'manual' | 'photo', mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
    setSelectedMealType(mealType);
    if (type === 'manual') {
      setMealModalOpen(true);
    } else {
      setPhotoMealModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Macros Dashboard */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="font-rounded text-xl font-semibold text-[#0E1012] mb-6">Today's Macros</h3>
        <div className="grid grid-cols-3 gap-6">
          {macros.map((macro) => {
            const percentage = (macro.current / macro.target) * 100;
            return (
              <div key={macro.name} className="relative">
                <div className="relative w-32 h-32 mx-auto">
                  {/* Background ring */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#12AFCB"
                      strokeOpacity="0.1"
                      strokeWidth="10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={macro.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(percentage / 100) * 351.86} 351.86`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#0E1012]">{macro.current}</span>
                    <span className="text-xs text-[#5A6B7F]">{macro.unit}</span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="font-rounded font-semibold text-[#0E1012]">{macro.name}</p>
                  <p className="text-sm text-[#5A6B7F]">
                    Goal: {macro.target}
                    {macro.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Meals */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Today's Meals</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200">
                <Plus className="w-4 h-4 text-[#12AFCB]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-[#5A6B7F]">Breakfast</div>
              <DropdownMenuItem onClick={() => handleAddMeal('manual', 'breakfast')}>
                <FileText className="w-4 h-4 mr-2" />
                Manual Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('photo', 'breakfast')}>
                <Camera className="w-4 h-4 mr-2" />
                Photo AI Analyze
              </DropdownMenuItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-[#5A6B7F] mt-2">Lunch</div>
              <DropdownMenuItem onClick={() => handleAddMeal('manual', 'lunch')}>
                <FileText className="w-4 h-4 mr-2" />
                Manual Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('photo', 'lunch')}>
                <Camera className="w-4 h-4 mr-2" />
                Photo AI Analyze
              </DropdownMenuItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-[#5A6B7F] mt-2">Snack</div>
              <DropdownMenuItem onClick={() => handleAddMeal('manual', 'snack')}>
                <FileText className="w-4 h-4 mr-2" />
                Manual Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('photo', 'snack')}>
                <Camera className="w-4 h-4 mr-2" />
                Photo AI Analyze
              </DropdownMenuItem>
              
              <div className="px-2 py-1.5 text-xs font-semibold text-[#5A6B7F] mt-2">Dinner</div>
              <DropdownMenuItem onClick={() => handleAddMeal('manual', 'dinner')}>
                <FileText className="w-4 h-4 mr-2" />
                Manual Entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddMeal('photo', 'dinner')}>
                <Camera className="w-4 h-4 mr-2" />
                Photo AI Analyze
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-[#5A6B7F]">No meals logged yet today. Click + to add a meal.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fasting Tracker with Timer */}
        <FastingTimer 
          fastingWindow={fastingWindow} 
          onStartFasting={() => setFastingModalOpen(true)}
          onRefresh={handleFastingSuccess}
        />

        {/* Supplements */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Supplements</h3>
            <button 
              onClick={() => setSupplementModalOpen(true)}
              className="w-8 h-8 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(18,175,203,0.3)] active:scale-95 flex items-center justify-center transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-[#12AFCB]" />
            </button>
          </div>
          <div className="space-y-4">
            {supplements.map((supplement) => (
              <div
                key={supplement.name}
                className="flex items-start justify-between p-4 rounded-xl bg-white/80 border border-[#12AFCB]/10"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#12AFCB] mt-2" />
                  <div>
                    <h4 className="font-rounded font-medium text-[#0E1012]">{supplement.name}</h4>
                    <p className="text-sm text-[#5A6B7F]">{supplement.dosage}</p>
                  </div>
                </div>
                <span className="text-xs text-[#5A6B7F]">{supplement.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby Cafés & Restaurants */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Nearby & Recommended</h3>
          <button 
            onClick={() => navigate('/local-events')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12AFCB]/10 hover:bg-[#12AFCB]/20 text-[#12AFCB] font-rounded font-medium text-sm transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Find More
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {nearbyCafes.map((cafe) => (
            <button
              key={cafe.name}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Utensils className="w-5 h-5 text-[#12AFCB] mt-0.5" />
                  <div>
                    <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">{cafe.name}</h4>
                    <p className="text-sm text-[#5A6B7F]">{cafe.distance}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#5A6B7F] group-hover:text-[#12AFCB] group-hover:translate-x-1 transition-all" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-full bg-[#12AFCB]/10 text-[#12AFCB] text-xs font-rounded font-medium">
                  {cafe.match}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cafe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#12AFCB]/5 text-[#5A6B7F] text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <MealModal 
        open={mealModalOpen} 
        onOpenChange={setMealModalOpen} 
        onSuccess={() => {}} 
        mealType={selectedMealType}
      />
      <FileUploadModal 
        open={photoMealModalOpen} 
        onOpenChange={setPhotoMealModalOpen} 
        onSuccess={() => {}}
        uploadType="meal-photo"
        mealType={selectedMealType}
      />
      <SupplementModal open={supplementModalOpen} onOpenChange={setSupplementModalOpen} onSuccess={() => {}} />
      <FastingQuickStart open={fastingModalOpen} onOpenChange={setFastingModalOpen} onSuccess={handleFastingSuccess} />
    </div>
  );
}
