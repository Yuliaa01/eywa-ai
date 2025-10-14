import { useState, useEffect } from "react";
import { User, Heart, Lock, Link as LinkIcon, ArrowLeft, Upload, File, X, FileImage } from "lucide-react";
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
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    sex_at_birth: "",
    height_cm: "",
    weight_kg: "",
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

  const loadFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from('user-files')
        .list(`${user.id}/`, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

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
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from('user-files')
          .upload(fileName, file);

        if (error) throw error;
      }

      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
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

  const handleDeleteFile = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.storage
        .from('user-files')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: "File removed successfully.",
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

  const getFileUrl = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.storage
        .from('user-files')
        .createSignedUrl(`${user.id}/${fileName}`, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error opening file:", error);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
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
        <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-rounded font-semibold text-muted-foreground">
            <LinkIcon className="w-4 h-4" />
            Connections
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-lg">Fitbit</Badge>
            <Badge variant="outline" className="rounded-lg">Oura</Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="p-4 rounded-xl bg-accent/5 border border-border hover:border-accent/30 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    {isImageFile(file.name) ? (
                      <FileImage className="w-5 h-5 text-accent" />
                    ) : (
                      <File className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => getFileUrl(file.name)}
                      className="text-sm font-medium truncate block w-full text-left hover:text-accent transition-colors"
                    >
                      {file.name.split('-').slice(1).join('-')}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {(file.metadata?.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.name)}
                    className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
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
            className="flex-1 rounded-xl"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
