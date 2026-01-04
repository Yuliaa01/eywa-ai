import { useState, useEffect, useRef } from "react";
import { User, Heart, Lock, ArrowLeft, Upload, File, X, FileImage, Loader2, CheckCircle, AlertCircle, Eye, MessageSquare, Palette, Utensils, Sparkles, Mail, FolderPlus, Folder, Trash2, GripVertical, ChevronDown, ChevronRight, FolderOpen, Pencil, Bell, Camera } from "lucide-react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FolderModal } from "@/components/modals/FolderModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { readSecureProfile, writeSecureProfile } from "@/utils/secureProfile";
export default function ProfileSettings() {
  const navigate = useNavigate();
  const {
    theme,
    setTheme
  } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    sex_at_birth: "",
    height_cm: "",
    weight_kg: ""
  });
  const [viewMode, setViewMode] = useState('standard');
  const [aiTone, setAiTone] = useState('friendly');
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [preferredUnits, setPreferredUnits] = useState('metric');
  const [dietPreferences, setDietPreferences] = useState<string[]>([]);
  const [religiousDiet, setReligiousDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [showCustomDiet, setShowCustomDiet] = useState(false);
  const [showCustomReligious, setShowCustomReligious] = useState(false);
  const [showCustomAllergy, setShowCustomAllergy] = useState(false);
  const [customDietInput, setCustomDietInput] = useState('');
  const [customReligiousInput, setCustomReligiousInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [macroMode, setMacroMode] = useState<'ai' | 'manual'>('ai');
  const [manualMacros, setManualMacros] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fats: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingFile, setEditingFile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [fileRenameModalOpen, setFileRenameModalOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  useEffect(() => {
    loadProfile();
    loadFiles();
    loadFolders();
  }, []);
  const loadProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      if (user?.email) setEmail(user.email);
      
      // Use secure profile read for decrypted sensitive fields
      const { profile: secureData, error: secureError } = await readSecureProfile();
      
      if (secureError) {
        console.error("Error loading secure profile:", secureError);
        // Fallback to direct read for non-sensitive fields only
        const { data, error } = await supabase.from("user_profiles").select("first_name, last_name, dob, sex_at_birth, height_cm, weight_kg, view_mode, locale, push_notifications_enabled, avatar_url").eq("user_id", user.id).single();
        if (error && error.code !== "PGRST116") throw error;
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            dob: data.dob || "",
            sex_at_birth: data.sex_at_birth || "",
            height_cm: data.height_cm?.toString() || "",
            weight_kg: data.weight_kg?.toString() || ""
          });
          setViewMode(data.view_mode || 'standard');
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
        return;
      }

      const data = secureData as Record<string, unknown>;
      if (data) {
        setProfile({
          first_name: (data.first_name as string) || "",
          last_name: (data.last_name as string) || "",
          dob: (data.dob as string) || "",
          sex_at_birth: (data.sex_at_birth as string) || "",
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || ""
        });

        // Load view mode from database column
        setViewMode((data.view_mode as string) || 'standard');

        // Load AI tone, macro mode from locale field (stored as JSON)
        try {
          const preferences = data.locale ? JSON.parse(data.locale as string) : {};
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

        // Load push notifications preference
        setPushNotificationsEnabled(data.push_notifications_enabled !== false);

        // Load avatar URL
        if (data.avatar_url) {
          setAvatarUrl(data.avatar_url as string);
        }

        // Load nutrition data (decrypted by secure-profile-read)
        setDietPreferences((data.diet_preferences as string[]) || []);
        setReligiousDiet((data.religious_diet as string[]) || []);
        setAllergies((data.allergies as string[]) || []);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Store AI tone, macro mode, and manual macros in locale field as JSON
      const preferences = JSON.stringify({
        aiTone,
        macroMode,
        preferredUnits,
        manualMacros: macroMode === 'manual' ? manualMacros : undefined
      });
      
      // Use secure profile write for encrypted storage of sensitive fields
      const { success, error: writeError } = await writeSecureProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        dob: profile.dob || null,
        sex_at_birth: profile.sex_at_birth || null,
        height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
        diet_preferences: dietPreferences,
        religious_diet: religiousDiet,
        allergies: allergies,
        view_mode: viewMode,
        locale: preferences,
        push_notifications_enabled: pushNotificationsEnabled
      });
      
      if (!success) throw new Error(writeError || 'Failed to save profile');
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved securely."
      });
    } catch (error) {
      console.error("Profile save error:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to user-avatars bucket (separate public bucket for avatars only)
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL from the avatars bucket
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);

      // Award profile_photo reward
      const { data: existingReward } = await supabase
        .from('user_rewards')
        .select('id')
        .eq('user_id', user.id)
        .eq('reward_id', (await supabase.from('rewards').select('id').eq('requirement_type', 'profile_photo').single()).data?.id)
        .single();

      if (!existingReward) {
        const { data: reward } = await supabase
          .from('rewards')
          .select('id')
          .eq('requirement_type', 'profile_photo')
          .single();

        if (reward) {
          await supabase.from('user_rewards').insert({
            user_id: user.id,
            reward_id: reward.id,
            trigger_data: { uploaded_at: new Date().toISOString() }
          });
        }
      }

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated."
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const loadFiles = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('uploaded_files').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };
  const loadFolders = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('file_folders').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };
  const handleCreateFolder = async (folderName: string) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setIsCreatingFolder(true);
      if (editingFolder) {
        // Update existing folder
        const {
          error
        } = await supabase.from('file_folders').update({
          name: folderName
        }).eq('id', editingFolder.id);
        if (error) throw error;
        toast({
          title: "Folder renamed",
          description: "Folder name updated successfully."
        });
      } else {
        // Create new folder
        const {
          error
        } = await supabase.from('file_folders').insert({
          user_id: user.id,
          name: folderName
        });
        if (error) throw error;
        toast({
          title: "Folder created",
          description: "New folder created successfully."
        });
      }
      setFolderModalOpen(false);
      setEditingFolder(null);
      loadFolders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };
  const confirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    try {
      const {
        error
      } = await supabase.from('file_folders').delete().eq('id', deletingFolder.id);
      if (error) throw error;
      toast({
        title: "Folder deleted",
        description: "Folder removed successfully."
      });
      setDeletingFolder(null);
      loadFolders();
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (!over) return;
    const fileId = active.id as string;
    const folderId = over.id as string;
    try {
      const {
        error
      } = await supabase.from('uploaded_files').update({
        folder_id: folderId
      }).eq('id', fileId);
      if (error) throw error;
      toast({
        title: "File moved",
        description: "File moved to folder successfully."
      });
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const getFilesInFolder = (folderId: string) => {
    return uploadedFiles.filter(file => file.folder_id === folderId);
  };
  const getFilesWithoutFolder = () => {
    return uploadedFiles.filter(file => !file.folder_id);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const {
          error: uploadError
        } = await supabase.storage.from('user-files').upload(filePath, file);
        if (uploadError) throw uploadError;

        // Create uploaded_files record
        const {
          data: fileRecord,
          error: recordError
        } = await supabase.from('uploaded_files').insert({
          user_id: user.id,
          name: file.name,
          size: file.size,
          type: file.type,
          storage_path: filePath,
          status: 'pending'
        }).select().single();
        if (recordError) throw recordError;

        // Trigger analysis in background
        supabase.functions.invoke('analyze-health-file', {
          body: {
            fileId: fileRecord.id,
            filePath,
            fileName: file.name
          }
        }).then(() => {
          loadFiles();
        });
      }
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded and queued for analysis.`
      });
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete from storage
      const {
        error: storageError
      } = await supabase.storage.from('user-files').remove([storagePath]);
      if (storageError) throw storageError;

      // Delete from database
      const {
        error: dbError
      } = await supabase.from('uploaded_files').delete().eq('id', fileId);
      if (dbError) throw dbError;

      // Delete related lab results
      await supabase.from('lab_results').delete().contains('provenance', {
        file_id: fileId
      });
      toast({
        title: "File deleted",
        description: "File and related data removed successfully."
      });
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const getFileUrl = async (storagePath: string) => {
    try {
      const {
        data
      } = await supabase.storage.from('user-files').createSignedUrl(storagePath, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };
  const handleReanalyze = async (fileId: string, filePath: string, fileName: string) => {
    try {
      await supabase.from('uploaded_files').update({
        status: 'pending',
        error_message: null
      }).eq('id', fileId);
      const {
        error
      } = await supabase.functions.invoke('analyze-health-file', {
        body: {
          fileId,
          filePath,
          fileName
        }
      });
      if (error) throw error;
      toast({
        title: "Analysis started",
        description: "File is being re-analyzed."
      });
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleRenameFile = async (newName: string) => {
    if (!editingFile) return;
    try {
      const {
        error
      } = await supabase.from('uploaded_files').update({
        name: newName
      }).eq('id', editingFile.id);
      if (error) throw error;
      toast({
        title: "File renamed",
        description: "File name updated successfully."
      });
      setFileRenameModalOpen(false);
      setEditingFile(null);
      loadFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
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
  const DraggableFile = ({
    file
  }: {
    file: any;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging
    } = useDraggable({
      id: file.id
    });
    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1
    } : undefined;
    return <div ref={setNodeRef} style={style} className="p-4 rounded-xl bg-accent/5 border border-border hover:border-accent/30 transition-colors">
        <div className="flex items-center gap-3">
          <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            {isImageFile(file.name) ? <FileImage className="w-5 h-5 text-accent" /> : <File className="w-5 h-5 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={() => getFileUrl(file.storage_path)} className="text-sm font-medium truncate block w-full text-left hover:text-accent transition-colors">
              {file.name}
            </button>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              {getStatusBadge(file.status)}
            </div>
            {file.error_message && <p className="text-xs text-amber-500 mt-1">{file.error_message}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {file.status === 'error' && <Button size="sm" variant="outline" onClick={() => handleReanalyze(file.id, file.storage_path, file.name)} className="rounded-lg">
                Analyze again
              </Button>}
            <button onClick={e => {
            e.stopPropagation();
            setEditingFile({
              id: file.id,
              name: file.name
            });
            setFileRenameModalOpen(true);
          }} className="w-8 h-8 rounded-lg hover:bg-accent/10 flex items-center justify-center transition-colors">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => handleDeleteFile(file.id, file.storage_path)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </div>
      </div>;
  };
  const DroppableFolder = ({
    folder
  }: {
    folder: any;
  }) => {
    const {
      setNodeRef,
      isOver
    } = useDroppable({
      id: folder.id
    });
    const filesInFolder = getFilesInFolder(folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    return <div ref={setNodeRef}>
        <div className={`p-4 rounded-xl border transition-all cursor-pointer ${isOver ? 'bg-accent/20 border-accent' : 'bg-accent/5 border-border hover:border-accent/30'}`} onClick={() => toggleFolder(folder.id)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              {isExpanded ? <FolderOpen className="w-5 h-5 text-yellow-600 flex-shrink-0" /> : <Folder className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{folder.name}</div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(folder.created_at).toLocaleDateString()} • {filesInFolder.length} file{filesInFolder.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={e => {
              e.stopPropagation();
              setEditingFolder({
                id: folder.id,
                name: folder.name
              });
              setFolderModalOpen(true);
            }} className="hover:bg-accent/10 flex-shrink-0">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={e => {
              e.stopPropagation();
              setDeletingFolder({
                id: folder.id,
                name: folder.name
              });
            }} className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Files inside folder */}
        {isExpanded && filesInFolder.length > 0 && <div className="ml-8 mt-2 space-y-2">
            {filesInFolder.map((file: any) => <DraggableFile key={file.id} file={file} />)}
          </div>}
        
        {isExpanded && filesInFolder.length === 0 && <div className="ml-8 mt-2 p-4 rounded-xl bg-muted/30 text-sm text-muted-foreground text-center">
            Empty folder - drag files here
          </div>}
      </div>;
  };
  return <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl hover:bg-accent/10 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-rounded font-bold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        
        {/* Profile Photo - Standalone */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, hide it to show fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              {/* Always show fallback icon behind the image */}
              <User className={`w-10 h-10 text-white absolute ${avatarUrl ? 'opacity-0' : ''}`} />
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent hover:bg-accent/90 flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* ACCOUNT Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">Account</p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="firstName" className="text-sm font-normal">First Name</Label>
              <Input 
                id="firstName" 
                value={profile.first_name} 
                onChange={e => setProfile({ ...profile, first_name: e.target.value })} 
                className="max-w-[180px] rounded-lg border-0 bg-muted/30 text-right focus-visible:ring-1" 
              />
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="lastName" className="text-sm font-normal">Last Name</Label>
              <Input 
                id="lastName" 
                value={profile.last_name} 
                onChange={e => setProfile({ ...profile, last_name: e.target.value })} 
                className="max-w-[180px] rounded-lg border-0 bg-muted/30 text-right focus-visible:ring-1" 
              />
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="email" className="text-sm font-normal">Email</Label>
              </div>
              <span className="text-sm text-muted-foreground">{email}</span>
            </div>
          </div>
        </div>

        {/* MEDICAL BASICS Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">Medical Basics</p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="dob" className="text-sm font-normal">Date of Birth</Label>
              <Input 
                id="dob" 
                type="date" 
                value={profile.dob} 
                onChange={e => setProfile({ ...profile, dob: e.target.value })} 
                className="max-w-[160px] rounded-lg border-0 bg-muted/30 text-right focus-visible:ring-1 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-datetime-edit]:text-right [&::-webkit-datetime-edit-fields-wrapper]:justify-end [&::-webkit-datetime-edit-fields-wrapper]:flex" 
              />
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="sex" className="text-sm font-normal">Sex at Birth</Label>
              <select 
                id="sex" 
                value={profile.sex_at_birth} 
                onChange={e => setProfile({ ...profile, sex_at_birth: e.target.value })} 
                className="px-3 py-1.5 rounded-lg border-0 bg-muted/30 text-sm text-right focus:ring-1 focus:ring-accent"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="units" className="text-sm font-normal">Preferred Units</Label>
              <select 
                id="units" 
                value={preferredUnits} 
                onChange={e => setPreferredUnits(e.target.value)} 
                className="px-3 py-1.5 rounded-lg border-0 bg-muted/30 text-sm text-right focus:ring-1 focus:ring-accent"
              >
                <option value="metric">Metric (cm, kg)</option>
                <option value="imperial">Imperial (in, lbs)</option>
              </select>
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="height" className="text-sm font-normal">Height ({preferredUnits === 'metric' ? 'cm' : 'in'})</Label>
              <Input 
                id="height" 
                type="number" 
                value={profile.height_cm} 
                onChange={e => setProfile({ ...profile, height_cm: e.target.value })} 
                className="max-w-[100px] rounded-lg border-0 bg-muted/30 text-right focus-visible:ring-1" 
              />
            </div>
            <div className="mx-4 border-t border-border/50" />
            <div className="px-4 py-3 flex items-center justify-between">
              <Label htmlFor="weight" className="text-sm font-normal">Weight ({preferredUnits === 'metric' ? 'kg' : 'lbs'})</Label>
              <Input 
                id="weight" 
                type="number" 
                value={profile.weight_kg} 
                onChange={e => setProfile({ ...profile, weight_kg: e.target.value })} 
                className="max-w-[100px] rounded-lg border-0 bg-muted/30 text-right focus-visible:ring-1" 
              />
            </div>
          </div>
        </div>

        {/* NUTRITION Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">Nutrition & Sensitivities</p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* Diet Preferences */}
            <div className="px-4 py-4">
              <Label className="text-sm font-normal mb-3 block">Diet Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {['Vegan', 'Vegetarian', 'Keto', 'Mediterranean', 'Pescatarian', 'Low-FODMAP', 'Gluten-Free', 'Dairy-Free'].map(option => (
                  <button 
                    key={option} 
                    onClick={() => {
                      if (dietPreferences.includes(option)) {
                        setDietPreferences(dietPreferences.filter(d => d !== option));
                      } else {
                        setDietPreferences([...dietPreferences, option]);
                      }
                    }} 
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-all ${
                      dietPreferences.includes(option) 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {dietPreferences.filter(d => !['Vegan', 'Vegetarian', 'Keto', 'Mediterranean', 'Pescatarian', 'Low-FODMAP', 'Gluten-Free', 'Dairy-Free'].includes(d)).map(custom => (
                  <button 
                    key={custom} 
                    onClick={() => setDietPreferences(dietPreferences.filter(d => d !== custom))} 
                    className="py-1.5 px-3 rounded-full text-sm font-medium bg-accent text-white"
                  >
                    {custom}
                  </button>
                ))}
                <button 
                  onClick={() => setShowCustomDiet(!showCustomDiet)} 
                  className="py-1.5 px-3 rounded-full text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted"
                >
                  Other...
                </button>
              </div>
              {showCustomDiet && (
                <div className="flex gap-2 mt-3">
                  <Input 
                    placeholder="Enter custom diet" 
                    value={customDietInput} 
                    onChange={e => setCustomDietInput(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter' && customDietInput.trim()) {
                        setDietPreferences([...dietPreferences, customDietInput.trim()]);
                        setCustomDietInput('');
                        setShowCustomDiet(false);
                      }
                    }} 
                    className="rounded-lg" 
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
                    className="rounded-lg bg-accent hover:bg-accent/90 text-white"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* Religious Food Preferences */}
            <div className="px-4 py-4">
              <Label className="text-sm font-normal mb-3 block">Religious Food Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {['Halal', 'Kosher', 'Hindu Vegetarian', 'Jain', 'Buddhist Vegetarian', 'Sattvic', 'No Pork', 'No Beef', 'No Alcohol in Cooking'].map(option => (
                  <button 
                    key={option} 
                    onClick={() => {
                      if (religiousDiet.includes(option)) {
                        setReligiousDiet(religiousDiet.filter(d => d !== option));
                      } else {
                        setReligiousDiet([...religiousDiet, option]);
                      }
                    }} 
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-all ${
                      religiousDiet.includes(option) 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {religiousDiet.filter(d => !['Halal', 'Kosher', 'Hindu Vegetarian', 'Jain', 'Buddhist Vegetarian', 'Sattvic', 'No Pork', 'No Beef', 'No Alcohol in Cooking'].includes(d)).map(custom => (
                  <button 
                    key={custom} 
                    onClick={() => setReligiousDiet(religiousDiet.filter(d => d !== custom))} 
                    className="py-1.5 px-3 rounded-full text-sm font-medium bg-accent text-white"
                  >
                    {custom}
                  </button>
                ))}
                <button 
                  onClick={() => setShowCustomReligious(!showCustomReligious)} 
                  className="py-1.5 px-3 rounded-full text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted"
                >
                  Other...
                </button>
              </div>
              {showCustomReligious && (
                <div className="flex gap-2 mt-3">
                  <Input 
                    placeholder="Enter preference" 
                    value={customReligiousInput} 
                    onChange={e => setCustomReligiousInput(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter' && customReligiousInput.trim()) {
                        setReligiousDiet([...religiousDiet, customReligiousInput.trim()]);
                        setCustomReligiousInput('');
                        setShowCustomReligious(false);
                      }
                    }} 
                    className="rounded-lg" 
                  />
                  <Button 
                    onClick={() => {
                      if (customReligiousInput.trim()) {
                        setReligiousDiet([...religiousDiet, customReligiousInput.trim()]);
                        setCustomReligiousInput('');
                        setShowCustomReligious(false);
                      }
                    }} 
                    size="sm" 
                    className="rounded-lg bg-accent hover:bg-accent/90 text-white"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* Allergies */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <Label className="text-sm font-normal">Allergies & Intolerances</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy/Lactose', 'Gluten', 'Soy', 'Sesame', 'Eggs'].map(option => (
                  <button 
                    key={option} 
                    onClick={() => {
                      if (allergies.includes(option)) {
                        setAllergies(allergies.filter(a => a !== option));
                      } else {
                        setAllergies([...allergies, option]);
                      }
                    }} 
                    className={`py-1.5 px-3 rounded-full text-sm font-medium transition-all ${
                      allergies.includes(option) 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {allergies.filter(a => !['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy/Lactose', 'Gluten', 'Soy', 'Sesame', 'Eggs'].includes(a)).map(custom => (
                  <button 
                    key={custom} 
                    onClick={() => setAllergies(allergies.filter(a => a !== custom))} 
                    className="py-1.5 px-3 rounded-full text-sm font-medium bg-accent text-white"
                  >
                    {custom}
                  </button>
                ))}
                <button 
                  onClick={() => setShowCustomAllergy(!showCustomAllergy)} 
                  className="py-1.5 px-3 rounded-full text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted"
                >
                  Other...
                </button>
              </div>
              {showCustomAllergy && (
                <div className="flex gap-2 mt-3">
                  <Input 
                    placeholder="Enter allergy" 
                    value={customAllergyInput} 
                    onChange={e => setCustomAllergyInput(e.target.value)} 
                    onKeyPress={e => {
                      if (e.key === 'Enter' && customAllergyInput.trim()) {
                        setAllergies([...allergies, customAllergyInput.trim()]);
                        setCustomAllergyInput('');
                        setShowCustomAllergy(false);
                      }
                    }} 
                    className="rounded-lg" 
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
                    className="rounded-lg bg-accent hover:bg-accent/90 text-white"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* Macro Targets */}
            <div className="px-4 py-4">
              <Label className="text-sm font-normal mb-3 block">Macro Targets</Label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setMacroMode('ai')} 
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    macroMode === 'ai' 
                      ? 'bg-accent text-white' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Auto
                </button>
                <button 
                  onClick={() => setMacroMode('manual')} 
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    macroMode === 'manual' 
                      ? 'bg-accent text-white' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  Manual
                </button>
              </div>
              {macroMode === 'manual' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="calories" className="text-xs text-muted-foreground">Calories (kcal)</Label>
                    <Input 
                      id="calories" 
                      type="number" 
                      placeholder="2000" 
                      value={manualMacros.calories} 
                      onChange={e => setManualMacros({ ...manualMacros, calories: e.target.value })} 
                      className="rounded-lg" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="protein" className="text-xs text-muted-foreground">Protein (g)</Label>
                    <Input 
                      id="protein" 
                      type="number" 
                      placeholder="150" 
                      value={manualMacros.protein} 
                      onChange={e => setManualMacros({ ...manualMacros, protein: e.target.value })} 
                      className="rounded-lg" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="carbs" className="text-xs text-muted-foreground">Carbs (g)</Label>
                    <Input 
                      id="carbs" 
                      type="number" 
                      placeholder="200" 
                      value={manualMacros.carbs} 
                      onChange={e => setManualMacros({ ...manualMacros, carbs: e.target.value })} 
                      className="rounded-lg" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fats" className="text-xs text-muted-foreground">Fats (g)</Label>
                    <Input 
                      id="fats" 
                      type="number" 
                      placeholder="70" 
                      value={manualMacros.fats} 
                      onChange={e => setManualMacros({ ...manualMacros, fats: e.target.value })} 
                      className="rounded-lg" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PREFERENCES Section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">Preferences</p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {/* Theme */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-normal">Theme</Label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'System', value: 'system' }].map(themeOption => (
                  <button 
                    key={themeOption.value} 
                    onClick={() => setTheme(themeOption.value as any)} 
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      theme === themeOption.value 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {themeOption.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* View Mode */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-normal">View Mode</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Standard', value: 'standard', desc: 'Goal-focused with AI chat' }, { label: 'Professional', value: 'professional', desc: 'Health metrics grid' }].map(mode => (
                  <button 
                    key={mode.value} 
                    onClick={() => setViewMode(mode.value)} 
                    className={`py-3 px-3 rounded-xl text-sm font-medium transition-all text-left ${
                      viewMode === mode.value 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{mode.label}</div>
                    <div className={`text-xs mt-0.5 ${viewMode === mode.value ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {mode.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* AI Tone */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-normal">AI Tone</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Friendly', value: 'friendly' }, { label: 'Clinical', value: 'clinical' }].map(tone => (
                  <button 
                    key={tone.value} 
                    onClick={() => setAiTone(tone.value)} 
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      aiTone === tone.value 
                        ? 'bg-accent text-white' 
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-4 border-t border-border/50" />

            {/* Push Notifications */}
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-normal">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Health reminders & alerts</p>
                </div>
              </div>
              <Switch 
                checked={pushNotificationsEnabled} 
                onCheckedChange={setPushNotificationsEnabled} 
                className="data-[state=checked]:bg-accent" 
              />
            </div>
          </div>
        </div>

        {/* UPLOADED FILES Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Uploaded Files</p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setFolderModalOpen(true)} 
                className="rounded-lg text-xs h-7 px-2"
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1" />
                Folder
              </Button>
              <label htmlFor="file-upload">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  disabled={uploading} 
                  className="rounded-lg text-xs h-7 px-2 cursor-pointer" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {uploading ? "..." : "Upload"}
                </Button>
                <input id="file-upload" type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            {uploadedFiles.length === 0 && folders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No files or folders yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[240px]">
                <div className="divide-y divide-border/50">
                  {folders.map((folder: any) => <DroppableFolder key={folder.id} folder={folder} />)}
                  {getFilesWithoutFolder().map((file: any) => <DraggableFile key={file.id} file={file} />)}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="flex-1 rounded-xl bg-accent hover:bg-accent/90 text-white"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Folder Modal */}
      <FolderModal 
        open={folderModalOpen} 
        onOpenChange={open => {
          setFolderModalOpen(open);
          if (!open) setEditingFolder(null);
        }} 
        onSubmit={handleCreateFolder} 
        isLoading={isCreatingFolder} 
        initialName={editingFolder?.name} 
        mode={editingFolder ? 'edit' : 'create'} 
      />

      {/* File Rename Modal */}
      <FolderModal 
        open={fileRenameModalOpen} 
        onOpenChange={open => {
          setFileRenameModalOpen(open);
          if (!open) setEditingFile(null);
        }} 
        onSubmit={handleRenameFile} 
        isLoading={false} 
        initialName={editingFile?.name} 
        mode="edit" 
        itemType="file" 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFolder} onOpenChange={open => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<span className="font-semibold">{deletingFolder?.name}</span>"? 
              This action cannot be undone. Files in this folder will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </DndContext>;
}