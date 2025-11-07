import { useState } from "react";
import { Utensils, AlertCircle, Sparkles, Plus, X } from "lucide-react";

interface NutritionStepProps {
  onNext: (data: any) => void;
}

export default function NutritionStep({ onNext }: NutritionStepProps) {
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [macroMode, setMacroMode] = useState<'ai' | 'manual'>('ai');
  const [customDiet, setCustomDiet] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  const dietOptions = [
    'Vegan', 'Vegetarian', 'Keto', 'Mediterranean', 'Pescatarian',
    'Low-FODMAP', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher',
  ];

  const allergyOptions = [
    'Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy/Lactose',
    'Gluten', 'Soy', 'Sesame', 'Eggs',
  ];

  const toggleSelection = (item: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const addCustomDiet = () => {
    if (customDiet.trim() && !diet.includes(customDiet.trim())) {
      setDiet([...diet, customDiet.trim()]);
      setCustomDiet('');
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const removeCustomItem = (item: string, list: string[], setter: (val: string[]) => void) => {
    setter(list.filter(i => i !== item));
  };

  const handleContinue = () => {
    onNext({ diet, allergies, macroMode });
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <Utensils className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Nutrition & Sensitivities
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Personalize your nutrition recommendations
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4">Diet Preferences</h3>
          <div className="flex flex-wrap gap-3 mb-3">
            {dietOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleSelection(option, diet, setDiet)}
                className={`px-4 py-2 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                  diet.includes(option)
                    ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                    : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          
          {/* Custom diet preferences */}
          {diet.filter(d => !dietOptions.includes(d)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {diet.filter(d => !dietOptions.includes(d)).map((item) => (
                <div
                  key={item}
                  className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white text-[0.875rem] font-medium flex items-center gap-2 shadow-[0_4px_12px_rgba(18,175,203,0.3)]"
                >
                  {item}
                  <button
                    onClick={() => removeCustomItem(item, diet, setDiet)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom diet input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customDiet}
              onChange={(e) => setCustomDiet(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomDiet()}
              placeholder="Add custom diet preference..."
              className="flex-1 h-10 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all text-[0.9375rem]"
            />
            <button
              onClick={addCustomDiet}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-medium hover:shadow-[0_4px_12px_rgba(18,175,203,0.3)] transition-all duration-standard flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Allergies & Intolerances
          </h3>
          <div className="flex flex-wrap gap-3 mb-3">
            {allergyOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleSelection(option, allergies, setAllergies)}
                className={`px-4 py-2 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                  allergies.includes(option)
                    ? 'bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                    : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Custom allergies */}
          {allergies.filter(a => !allergyOptions.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {allergies.filter(a => !allergyOptions.includes(a)).map((item) => (
                <div
                  key={item}
                  className="px-3 py-1.5 rounded-2xl bg-red-500 text-white text-[0.875rem] font-medium flex items-center gap-2 shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
                >
                  {item}
                  <button
                    onClick={() => removeCustomItem(item, allergies, setAllergies)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom allergy input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
              placeholder="Add custom allergy..."
              className="flex-1 h-10 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all text-[0.9375rem]"
            />
            <button
              onClick={addCustomAllergy}
              className="h-10 px-4 rounded-2xl bg-red-500 text-white font-medium hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all duration-standard flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6">
          <h3 className="text-[1.125rem] font-semibold text-[#0E1012] mb-4">Macro Targets</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMacroMode('ai')}
              className={`p-6 rounded-2xl transition-all duration-standard ${
                macroMode === 'ai'
                  ? 'bg-gradient-to-br from-[#12AFCB]/10 to-[#12AFCB]/5 border-2 border-[#12AFCB]'
                  : 'bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80'
              }`}
            >
              <Sparkles className={`w-8 h-8 mb-2 ${macroMode === 'ai' ? 'text-[#12AFCB]' : 'text-[#5A6B7F]'}`} />
              <div className="text-[1rem] font-semibold text-[#0E1012] mb-1">AI Auto</div>
              <div className="text-[0.875rem] text-[#5A6B7F]">Personalized by AI</div>
            </button>

            <button
              onClick={() => setMacroMode('manual')}
              className={`p-6 rounded-2xl transition-all duration-standard ${
                macroMode === 'manual'
                  ? 'bg-gradient-to-br from-[#12AFCB]/10 to-[#12AFCB]/5 border-2 border-[#12AFCB]'
                  : 'bg-white/60 border border-[#12AFCB]/10 hover:bg-white/80'
              }`}
            >
              <Utensils className={`w-8 h-8 mb-2 ${macroMode === 'manual' ? 'text-[#12AFCB]' : 'text-[#5A6B7F]'}`} />
              <div className="text-[1rem] font-semibold text-[#0E1012] mb-1">Manual</div>
              <div className="text-[0.875rem] text-[#5A6B7F]">Set your own</div>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
      >
        Continue
      </button>
    </div>
  );
}
