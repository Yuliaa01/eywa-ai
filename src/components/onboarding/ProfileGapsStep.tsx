import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface ProfileGapsStepProps {
  onNext: (data: any) => void;
  missingFields?: string[];
}

export default function ProfileGapsStep({ onNext, missingFields = ['dob'] }: ProfileGapsStepProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    sex: '',
    height: '',
    weight: '',
  });

  const handleSubmit = () => {
    onNext(formData);
  };

  const fieldLabels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    dob: 'Date of Birth',
    sex: 'Sex at Birth',
    height: 'Height (cm)',
    weight: 'Weight (kg)',
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <AlertCircle className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Complete Your Profile
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          We need a few more details to personalize your experience
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="space-y-6">
          {missingFields.map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-[0.9375rem] font-medium text-[#0E1012]">
                {fieldLabels[field]}
                {(field === 'firstName' || field === 'lastName' || field === 'dob') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {field === 'sex' ? (
                <select
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all duration-standard"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : field === 'dob' ? (
                <input
                  type="date"
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all duration-standard"
                />
              ) : (
                <input
                  type={field === 'height' || field === 'weight' ? 'number' : 'text'}
                  value={formData[field as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all duration-standard"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
      >
        Continue
      </button>
    </div>
  );
}
