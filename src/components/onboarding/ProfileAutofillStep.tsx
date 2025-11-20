import { useState, useEffect } from "react";
import { Check, Edit, X } from "lucide-react";

interface ProfileData {
  firstName?: string;
  lastName?: string;
  dob?: string;
  sex?: string;
  height?: number;
  weight?: number;
  preferredUnits?: string;
  source?: string;
}

interface ProfileAutofillStepProps {
  profileData?: ProfileData;
  onNext: (data?: any) => void;
}

export default function ProfileAutofillStep({ profileData, onNext }: ProfileAutofillStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    dob: profileData?.dob || '',
    sex: profileData?.sex || '',
    height: profileData?.height?.toString() || '',
    heightFeet: '',
    heightInches: '',
    weight: profileData?.weight?.toString() || '',
    preferredUnits: profileData?.preferredUnits || 'metric',
  });

  // Update form data when profileData changes (e.g., when navigating back)
  useEffect(() => {
    if (profileData) {
      const heightCm = profileData.height || 0;
      const totalInches = heightCm * 0.393701;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        dob: profileData.dob || '',
        sex: profileData.sex || '',
        height: profileData.height?.toString() || '',
        heightFeet: feet > 0 ? feet.toString() : '',
        heightInches: inches > 0 ? inches.toString() : '',
        weight: profileData.weight?.toString() || '',
        preferredUnits: profileData.preferredUnits || 'metric',
      });
    }
  }, [profileData]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    const heightCm = profileData?.height || 0;
    const totalInches = heightCm * 0.393701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    
    // Reset form data to original values
    setFormData({
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      dob: profileData?.dob || '',
      sex: profileData?.sex || '',
      height: profileData?.height?.toString() || '',
      heightFeet: feet > 0 ? feet.toString() : '',
      heightInches: inches > 0 ? inches.toString() : '',
      weight: profileData?.weight?.toString() || '',
      preferredUnits: profileData?.preferredUnits || 'metric',
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    let heightCm;
    if (formData.preferredUnits === 'imperial') {
      const feet = parseFloat(formData.heightFeet) || 0;
      const inches = parseFloat(formData.heightInches) || 0;
      const totalInches = (feet * 12) + inches;
      heightCm = totalInches * 2.54;
    } else {
      heightCm = formData.height ? parseFloat(formData.height) : undefined;
    }
    
    const mappedData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      dob: formData.dob,
      sex_at_birth: formData.sex,
      height_cm: heightCm,
      weight_kg: formData.weight ? parseFloat(formData.weight) : undefined,
      preferred_units: formData.preferredUnits,
    };
    
    setIsEditing(false);
    onNext(mappedData);
  };

  const isMetric = formData.preferredUnits === 'metric';
  const weightUnit = isMetric ? 'kg' : 'lbs';

  const getHeightDisplay = () => {
    if (isMetric) {
      return formData.height ? `${formData.height} cm` : '';
    } else {
      const feet = formData.heightFeet || '0';
      const inches = formData.heightInches || '0';
      return `${feet}' ${inches}"`;
    }
  };

  const fields = [
    { label: 'First Name', value: formData.firstName, key: 'firstName' },
    { label: 'Last Name', value: formData.lastName, key: 'lastName' },
    { label: 'Date of Birth', value: formData.dob, key: 'dob', type: 'date' },
    { label: 'Sex at Birth', value: formData.sex, key: 'sex', type: 'select', options: ['male', 'female', 'other'] },
    { label: 'Preferred Units', value: formData.preferredUnits === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft/in)', key: 'preferredUnits', type: 'select', options: ['metric', 'imperial'] },
    { label: 'Height', value: getHeightDisplay(), key: 'height', type: isMetric ? 'number' : 'height-imperial' },
    { label: `Weight (${weightUnit})`, value: formData.weight ? `${formData.weight} ${weightUnit}` : '', key: 'weight', type: 'number' },
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
              className="pb-6 border-b border-[#12AFCB]/10 last:border-0 last:pb-0"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <label className="block text-[0.875rem] text-[#5A6B7F] font-medium">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                    >
                      <option value="">Select...</option>
                      {field.key === 'sex' && (
                        <>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </>
                      )}
                      {field.key === 'preferredUnits' && (
                        <>
                          <option value="metric">Metric (kg, cm)</option>
                          <option value="imperial">Imperial (lbs, inches)</option>
                        </>
                      )}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                    />
                  ) : field.type === 'height-imperial' ? (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={formData.heightFeet}
                          onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                          placeholder="Feet"
                          min="0"
                          step="1"
                          className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={formData.heightInches}
                          onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                          placeholder="Inches"
                          min="0"
                          max="11"
                          step="1"
                          className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                        />
                      </div>
                    </div>
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      step="0.1"
                      placeholder={field.label}
                      className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.label}
                      className="w-full h-12 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#0E1012] placeholder:text-[#5A6B7F]/50 focus:outline-none focus:border-[#12AFCB]/30 focus:ring-2 focus:ring-[#12AFCB]/20 transition-all"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[0.875rem] text-[#5A6B7F] font-medium">
                      {field.label}
                    </div>
                    <div className="text-[1.125rem] text-[#0E1012] font-semibold">
                      {field.value || 'Not provided'}
                    </div>
                  </div>
                  {profileData?.source && (
                    <div className="px-3 py-1 rounded-full bg-[#12AFCB]/10 border border-[#12AFCB]/20">
                      <span className="text-[0.75rem] text-[#12AFCB] font-medium">
                        {profileData.source}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={handleCancelEdit}
            className="flex-1 h-14 rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1.0625rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="flex-1 h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
          >
            Save & Continue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => {
              let heightCm;
              if (formData.preferredUnits === 'imperial') {
                const feet = parseFloat(formData.heightFeet) || 0;
                const inches = parseFloat(formData.heightInches) || 0;
                const totalInches = (feet * 12) + inches;
                heightCm = totalInches * 2.54;
              } else {
                heightCm = formData.height ? parseFloat(formData.height) : undefined;
              }
              
              onNext({
                first_name: formData.firstName,
                last_name: formData.lastName,
                dob: formData.dob,
                sex_at_birth: formData.sex,
                height_cm: heightCm,
                weight_kg: formData.weight ? parseFloat(formData.weight) : undefined,
                preferred_units: formData.preferredUnits,
              });
            }}
            className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
          >
            Confirm & Continue
          </button>

          <button
            onClick={handleEditClick}
            className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Information
          </button>
        </div>
      )}
    </div>
  );
}
