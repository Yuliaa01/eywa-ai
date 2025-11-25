import { useState, useEffect } from "react";
import { User, Heart, Lock, ArrowLeft, Upload, File, X, FileImage, Loader2, CheckCircle, AlertCircle, Eye, MessageSquare, Palette, Utensils, Sparkles, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    sex_at_birth: "",
    height_cm: "",
    weight_kg: "",
  });
  const [viewMode, setViewMode] = useState('standard');
  const [aiTone, setAiTone] = useState('friendly');
  const [preferredUnits, setPreferredUnits] = useState('metric');
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [showCustomDiet, setShowCustomDiet] = useState(false);
  const [showCustomAllergy, setShowCustomAllergy] = useState(false);
  const [customDietInput, setCustomDietInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [macroMode, setMacroMode] = useState<'ai' | 'manual'>('ai');
  const [manualMacros, setManualMacros] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadFiles();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user?.email) setEmail(user.email);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          dob: data.dob || "",
          sex_at_birth: data.sex_at_birth || "",
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
        });
        
        // Load view mode from database column
        setViewMode(data.view_mode || 'standard');
        
        // Load AI tone, macro mode from locale field (stored as JSON)
        try {
          const preferences = data.locale ? JSON.parse(data.locale) : {};
          setAiTone(preferences.aiTone || 'friendly');
          setMacroMode(preferences.macroMode || 'ai');
          setPreferredUnits(preferences.preferredUnits || 'metric');
          setManualMacros({
            calories: preferences.manualMacros?.calories || '',
            protein: preferences.manualMacros?.protein || '',
            carbs: preferences.manualMacros?.carbs || '',
            fats: preferences.manualMacros?.fats || ''
          });
        } catch {
          setAiTone('friendly');
          setMacroMode('ai');
          setPreferredUnits('metric');
        }
        
        // Load nutrition data
        setDietPreferences(data.diet_preferences || []);
        setAllergies(data.allergies || []);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Store AI tone, macro mode, and manual macros in locale field as JSON
      const preferences = JSON.stringify({ 
        aiTone, 
        macroMode,
        preferredUnits,
        manualMacros: macroMode === 'manual' ? manualMacros : undefined
      });
      
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          user_id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          dob: profile.dob || null,
          sex_at_birth: profile.sex_at_birth as any || null,
          height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
          diet_preferences: dietPreferences,
          allergies: allergies,
          view_mode: viewMode,
          locale: preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create uploaded_files record
        const { data: fileRecord, error: recordError } = await supabase
          .from('uploaded_files')
          .insert({
            user_id: user.id,
            name: file.name,
            size: file.size,
            type: file.type,
            storage_path: filePath,
            status: 'pending',
          })
          .select()
          .single();

        if (recordError) throw recordError;

        // Trigger analysis in background
        supabase.functions.invoke('analyze-health-file', {
          body: { fileId: fileRecord.id, filePath, fileName: file.name }
        }).then(() => {
          loadFiles();
        });
      }

      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded and queued for analysis.`,
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Delete related lab results
      await supabase
        .from('lab_results')
        .delete()
        .contains('provenance', { file_id: fileId });

      toast({
        title: "File deleted",
        description: "File and related data removed successfully.",
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getFileUrl = async (storagePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('user-files')
        .createSignedUrl(storagePath, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  const handleReanalyze = async (fileId: string, filePath: string, fileName: string) => {
    try {
      await supabase
        .from('uploaded_files')
        .update({ status: 'pending', error_message: null })
        .eq('id', fileId);

      const { error } = await supabase.functions.invoke('analyze-health-file', {
        body: { fileId, filePath, fileName }
      });

      if (error) throw error;

      toast({
        title: "Analysis started",
        description: "File is being re-analyzed.",
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="rounded-lg text-muted-foreground">Queued</Badge>;
      case 'parsing':
        return <Badge variant="outline" className="rounded-lg"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzing...</Badge>;
      case 'parsed':
        return <Badge variant="outline" className="rounded-lg text-accent-teal"><CheckCircle className="w-3 h-3 mr-1" />Parsed</Badge>;
      case 'error':
        return <Badge variant="outline" className="rounded-lg text-amber-500"><AlertCircle className="w-3 h-3 mr-1" />Needs review</Badge>;
      default:
        return null;
    }
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl hover:bg-accent/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-rounded font-bold">Profile Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Account Section */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
            <User className="w-4 h-4" />
            Account
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Medical Basics */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
            <Heart className="w-4 h-4" />
            Medical Basics
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex at Birth</Label>
              <select
                id="sex"
                value={profile.sex_at_birth}
                onChange={(e) => setProfile({ ...profile, sex_at_birth: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-input bg-background"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Preferred Units</Label>
              <select
                id="units"
                value={preferredUnits}
                onChange={(e) => setPreferredUnits(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-input bg-background"
              >
                <option value="metric">Metric (cm, kg)</option>
                <option value="imperial">Imperial (inches, lbs)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height ({preferredUnits === 'metric' ? 'cm' : 'inches'})</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight ({preferredUnits === 'metric' ? 'kg' : 'lbs'})</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition & Sensitivities */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
            <Utensils className="w-4 h-4" />
            Nutrition & Sensitivities
          </div>
          
          <div className="space-y-6">
            {/* Diet Preferences */}
            <div className="space-y-3">
              <Label>Diet Preferences</Label>
              <div className="flex flex-wrap gap-3">
                {['Vegan', 'Vegetarian', 'Keto', 'Mediterranean', 'Pescatarian', 'Low-FODMAP', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (dietPreferences.includes(option)) {
                        setDietPreferences(dietPreferences.filter(d => d !== option));
                      } else {
                        setDietPreferences([...dietPreferences, option]);
                      }
                    }}
                    className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                      dietPreferences.includes(option)
                        ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                        : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                
                {/* Display custom diet preferences */}
                {dietPreferences.filter(d => !['Vegan', 'Vegetarian', 'Keto', 'Mediterranean', 'Pescatarian', 'Low-FODMAP', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher'].includes(d)).map((custom) => (
                  <button
                    key={custom}
                    onClick={() => setDietPreferences(dietPreferences.filter(d => d !== custom))}
                    className="py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]"
                  >
                    {custom}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowCustomDiet(!showCustomDiet)}
                  className="py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20"
                >
                  Other...
                </button>
              </div>
              
              {showCustomDiet && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom diet preference"
                    value={customDietInput}
                    onChange={(e) => setCustomDietInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customDietInput.trim()) {
                        setDietPreferences([...dietPreferences, customDietInput.trim()]);
                        setCustomDietInput('');
                        setShowCustomDiet(false);
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => {
                      if (customDietInput.trim()) {
                        setDietPreferences([...dietPreferences, customDietInput.trim()]);
                        setCustomDietInput('');
                        setShowCustomDiet(false);
                      }
                    }}
                    size="sm"
                    className="rounded-xl"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Allergies & Intolerances */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <Label>Allergies & Intolerances</Label>
              </div>
              <div className="flex flex-wrap gap-3">
                {['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy/Lactose', 'Gluten', 'Soy', 'Sesame', 'Eggs'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (allergies.includes(option)) {
                        setAllergies(allergies.filter(a => a !== option));
                      } else {
                        setAllergies([...allergies, option]);
                      }
                    }}
                    className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                      allergies.includes(option)
                        ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                        : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                
                {/* Display custom allergies */}
                {allergies.filter(a => !['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy/Lactose', 'Gluten', 'Soy', 'Sesame', 'Eggs'].includes(a)).map((custom) => (
                  <button
                    key={custom}
                    onClick={() => setAllergies(allergies.filter(a => a !== custom))}
                    className="py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]"
                  >
                    {custom}
                  </button>
                ))}
                
                <button
                  onClick={() => setShowCustomAllergy(!showCustomAllergy)}
                  className="py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20"
                >
                  Other...
                </button>
              </div>
              
              {showCustomAllergy && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom allergy/intolerance"
                    value={customAllergyInput}
                    onChange={(e) => setCustomAllergyInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customAllergyInput.trim()) {
                        setAllergies([...allergies, customAllergyInput.trim()]);
                        setCustomAllergyInput('');
                        setShowCustomAllergy(false);
                      }
                    }}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={() => {
                      if (customAllergyInput.trim()) {
                        setAllergies([...allergies, customAllergyInput.trim()]);
                        setCustomAllergyInput('');
                        setShowCustomAllergy(false);
                      }
                    }}
                    size="sm"
                    className="rounded-xl"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Macro Targets */}
            <div className="space-y-3">
              <Label>Macro Targets</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMacroMode('ai')}
                  className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard flex items-center justify-center gap-2 ${
                    macroMode === 'ai'
                      ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                      : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Auto
                </button>

                <button
                  onClick={() => setMacroMode('manual')}
                  className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard flex items-center justify-center gap-2 ${
                    macroMode === 'manual'
                      ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                      : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  Manual
                </button>
              </div>
              
              {/* Manual Macro Inputs */}
              {macroMode === 'manual' && (
                <div className="mt-4 space-y-3 p-4 rounded-2xl bg-white/60 border border-[#12AFCB]/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories (kcal)</Label>
                      <Input
                        id="calories"
                        type="number"
                        placeholder="2000"
                        value={manualMacros.calories}
                        onChange={(e) => setManualMacros({ ...manualMacros, calories: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        placeholder="150"
                        value={manualMacros.protein}
                        onChange={(e) => setManualMacros({ ...manualMacros, protein: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carbs">Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        placeholder="200"
                        value={manualMacros.carbs}
                        onChange={(e) => setManualMacros({ ...manualMacros, carbs: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fats">Fats (g)</Label>
                      <Input
                        id="fats"
                        type="number"
                        placeholder="70"
                        value={manualMacros.fats}
                        onChange={(e) => setManualMacros({ ...manualMacros, fats: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
            <Lock className="w-4 h-4" />
            Preferences
          </div>
          
          <div className="space-y-6">
            {/* Theme */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-accent" />
                <Label>Theme</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'System', value: 'system' }
                ].map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value as any)}
                    className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                      theme === themeOption.value
                        ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                        : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                    }`}
                  >
                    {themeOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <Label>View Mode</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Standard', value: 'standard', description: 'Goal-focused cards with AI chat' },
                  { label: 'Professional', value: 'professional', description: 'Apple Health-style metrics grid' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`py-3 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard text-left ${
                      viewMode === mode.value
                        ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                        : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                    }`}
                  >
                    <div className="font-semibold">{mode.label}</div>
                    <div className={`text-xs mt-1 ${viewMode === mode.value ? 'text-white/80' : 'text-[#5A6B7F]'}`}>
                      {mode.description}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#5A6B7F] mt-2">
                Switch between Standard view (goals & AI chat) and Professional view (health metrics grid). Save changes to apply.
              </p>
            </div>

            {/* AI Tone */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <Label>AI Tone</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Friendly', value: 'friendly' },
                  { label: 'Clinical', value: 'clinical' }
                ].map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setAiTone(tone.value)}
                    className={`py-2 px-4 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard ${
                      aiTone === tone.value
                        ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                        : 'bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] hover:bg-white/80 hover:border-[#12AFCB]/20'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
              <File className="w-4 h-4" />
              Uploaded Files
            </div>
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                className="rounded-xl cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-accent/5 border border-border hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {isImageFile(file.name) ? (
                        <FileImage className="w-5 h-5 text-accent" />
                      ) : (
                        <File className="w-5 h-5 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => getFileUrl(file.storage_path)}
                        className="text-sm font-medium truncate block w-full text-left hover:text-accent transition-colors"
                      >
                        {file.name}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                        {getStatusBadge(file.status)}
                      </div>
                      {file.error_message && (
                        <p className="text-xs text-amber-500 mt-1">{file.error_message}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {file.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReanalyze(file.id, file.storage_path, file.name)}
                          className="rounded-lg"
                        >
                          Analyze again
                        </Button>
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id, file.storage_path)}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)] hover:shadow-[0_6px_16px_rgba(18,175,203,0.4)] transition-all"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
