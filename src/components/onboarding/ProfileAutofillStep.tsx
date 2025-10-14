import { Check, Edit } from "lucide-react";

interface ProfileData {
  firstName?: string;
  lastName?: string;
  dob?: string;
  sex?: string;
  height?: number;
  weight?: number;
  source?: string;
}

interface ProfileAutofillStepProps {
  profileData?: ProfileData;
  onNext: () => void;
  onEdit: () => void;
}

export default function ProfileAutofillStep({ profileData, onNext, onEdit }: ProfileAutofillStepProps) {
  const fields = [
    { label: 'First Name', value: profileData?.firstName, source: profileData?.source },
    { label: 'Last Name', value: profileData?.lastName, source: profileData?.source },
    { label: 'Date of Birth', value: profileData?.dob, source: profileData?.source },
    { label: 'Sex at Birth', value: profileData?.sex, source: profileData?.source },
    { label: 'Height', value: profileData?.height ? `${profileData.height} cm` : undefined, source: profileData?.source },
    { label: 'Weight', value: profileData?.weight ? `${profileData.weight} kg` : undefined, source: profileData?.source },
  ];

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <Check className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Profile Preview
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          We've automatically filled your profile from connected sources
        </p>
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="space-y-6">
          {fields.map((field, idx) => (
            <div 
              key={field.label}
              className="flex items-center justify-between pb-6 border-b border-[#12AFCB]/10 last:border-0 last:pb-0"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="space-y-1">
                <div className="text-[0.875rem] text-[#5A6B7F] font-medium">
                  {field.label}
                </div>
                <div className="text-[1.125rem] text-[#0E1012] font-semibold">
                  {field.value || 'Not provided'}
                </div>
              </div>
              {field.source && (
                <div className="px-3 py-1 rounded-full bg-[#12AFCB]/10 border border-[#12AFCB]/20">
                  <span className="text-[0.75rem] text-[#12AFCB] font-medium">
                    {field.source}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Confirm & Continue
        </button>

        <button
          onClick={onEdit}
          className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Information
        </button>
      </div>
    </div>
  );
}
