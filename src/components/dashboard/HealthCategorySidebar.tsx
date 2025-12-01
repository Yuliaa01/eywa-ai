import { Activity, Heart, Moon, Brain, Salad, Scale, Pin, Pill, Accessibility, Wind, Stethoscope, FileText, MessageSquare, Rocket } from "lucide-react";
interface HealthCategorySidebarProps {
  activeCategory: string;
  onCategoryClick: (category: string) => void;
}
const categories = [{
  id: "pinned",
  label: "Pinned",
  icon: Pin
}, {
  id: "action-plan",
  label: "My Action Plan",
  icon: Rocket
}, {
  id: "activity",
  label: "Activity",
  icon: Activity
}, {
  id: "body",
  label: "Body",
  icon: Scale
}, {
  id: "nutrition",
  label: "Nutrition",
  icon: Salad
}, {
  id: "sleep",
  label: "Sleep",
  icon: Moon
}, {
  id: "heart",
  label: "Heart / Vitals",
  icon: Heart
}, {
  id: "mental",
  label: "Mental",
  icon: Brain
}, {
  id: "medications",
  label: "Medications",
  icon: Pill
}, {
  id: "mobility",
  label: "Mobility",
  icon: Accessibility
}, {
  id: "respiratory",
  label: "Respiratory",
  icon: Wind
}, {
  id: "symptoms",
  label: "Symptoms",
  icon: Stethoscope
}, {
  id: "records",
  label: "Health Records",
  icon: FileText
}];
export function HealthCategorySidebar({
  activeCategory,
  onCategoryClick
}: HealthCategorySidebarProps) {
  return <div className="space-y-3">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-[#0E1012] mb-4 px-2">
          Categories
        </h3>
        <nav className="space-y-1">
          {categories.map(category => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          return <button key={category.id} onClick={() => onCategoryClick(category.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-[#12AFCB]/10 text-[#12AFCB]" : "text-[#5A6B7F] hover:bg-gray-50"}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{category.label}</span>
              </button>;
        })}
        </nav>
      </div>

      {/* Separate AI Chat Button */}
      <button onClick={() => onCategoryClick("chat")} className={`w-full flex items-center gap-3 pl-7 pr-4 py-3 rounded-2xl transition-all border shadow-sm ${activeCategory === "chat" ? "bg-[#12AFCB] text-white border-[#12AFCB]" : "bg-white/80 backdrop-blur-xl text-[#5A6B7F] hover:bg-gray-50 border-gray-100"}`}>
        <MessageSquare className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium ">AI Health Coach</span>
      </button>
    </div>;
}