import { useState, useEffect, useRef } from "react";
import { User, Lock, Heart, Link as LinkIcon, CreditCard, Shield, X, Camera, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { awardReward, fetchAllRewards } from "@/api/rewards";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    sex_at_birth: "",
    height_cm: "",
    weight_kg: "",
  });

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);

      // Check and award the profile photo reward
      const allRewards = await fetchAllRewards();
      const profilePhotoReward = allRewards.find(r => r.requirement_type === 'profile_photo');
      if (profilePhotoReward) {
        await awardReward(user.id, profilePhotoReward.id);
      }

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[32rem] p-0 overflow-y-auto">
        <SheetHeader className="p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-rounded">Profile Settings</SheetTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-accent/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-8">
          {/* Account Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
              <User className="w-4 h-4" />
              Account
            </div>
            <div className="space-y-4">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-border">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
                    <AvatarFallback className="text-lg">
                      {profile.first_name?.[0]?.toUpperCase() || profile.last_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">
                    Click the camera icon to upload a photo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Medical Basics */}
          <div className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
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

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
              <Lock className="w-4 h-4" />
              Preferences
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Connections */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
              <LinkIcon className="w-4 h-4" />
              Connections
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-lg">Fitbit</Badge>
              <Badge variant="outline" className="rounded-lg">Oura</Badge>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-0 bg-card pt-4 border-t border-border -mx-6 px-6 pb-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-xl"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
