import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Loader2, Check, Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupplementPhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DetectedSupplement {
  name: string;
  dosage: string;
  form: string;
  selected: boolean;
  isEditing: boolean;
}

const FORM_OPTIONS = ['tablet', 'capsule', 'liquid', 'powder', 'gummy'];

export function SupplementPhotoModal({ open, onOpenChange, onSuccess }: SupplementPhotoModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedSupplements, setDetectedSupplements] = useState<DetectedSupplement[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze the image
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setDetectedSupplements([]);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('analyze-supplement-photo', {
        body: { image: base64 }
      });

      if (error) throw error;

      if (data.supplements && data.supplements.length > 0) {
        setDetectedSupplements(data.supplements.map((s: any) => ({ 
          ...s, 
          selected: true,
          isEditing: false 
        })));
        toast({
          title: "Supplements detected",
          description: `Found ${data.supplements.length} supplement(s). Tap to edit details.`,
        });
      } else {
        toast({
          title: "No supplements detected",
          description: "Try taking a clearer photo of your supplement bottles.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSupplementSelection = (index: number) => {
    setDetectedSupplements(prev => 
      prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s)
    );
  };

  const toggleEditMode = (index: number) => {
    setDetectedSupplements(prev => 
      prev.map((s, i) => i === index ? { ...s, isEditing: !s.isEditing } : s)
    );
  };

  const updateSupplement = (index: number, field: keyof DetectedSupplement, value: string) => {
    setDetectedSupplements(prev => 
      prev.map((s, i) => i === index ? { ...s, [field]: value } : s)
    );
  };

  const handleAddSelected = async () => {
    const selectedSupplements = detectedSupplements.filter(s => s.selected);
    if (selectedSupplements.length === 0) {
      toast({
        title: "No supplements selected",
        description: "Please select at least one supplement to add.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const supplementsToInsert = selectedSupplements.map(s => ({
        user_id: user.id,
        name: s.name,
        dosage: s.dosage,
        form: s.form as any,
        source: 'user' as const,
      }));

      const { error } = await supabase
        .from('supplements')
        .insert(supplementsToInsert);

      if (error) throw error;

      toast({
        title: "Supplements added",
        description: `Added ${selectedSupplements.length} supplement(s) to your list.`,
      });

      onOpenChange(false);
      onSuccess?.();
      resetModal();
    } catch (error: any) {
      console.error('Error saving supplements:', error);
      toast({
        title: "Failed to save",
        description: error.message || "Could not save supplements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetModal = () => {
    setImagePreview(null);
    setDetectedSupplements([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) resetModal();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-rounded">Analyze Supplement Photo</DialogTitle>
          <DialogDescription>
            Take a photo of your supplement bottles and we'll automatically detect them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!imagePreview ? (
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-32 border-dashed border-2 flex flex-col gap-2"
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span>Take Photo or Upload</span>
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Supplement photo" 
                  className="w-full h-40 object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>

              {detectedSupplements.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Detected Supplements:</p>
                  {detectedSupplements.map((supplement, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border transition-all ${
                        supplement.selected 
                          ? 'border-accent bg-accent/5' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      {supplement.isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={supplement.name}
                              onChange={(e) => updateSupplement(index, 'name', e.target.value)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Dosage</Label>
                            <Input
                              value={supplement.dosage}
                              onChange={(e) => updateSupplement(index, 'dosage', e.target.value)}
                              placeholder="e.g., 1000mg"
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Form</Label>
                            <Select 
                              value={supplement.form} 
                              onValueChange={(value) => updateSupplement(index, 'form', value)}
                            >
                              <SelectTrigger className="h-9 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FORM_OPTIONS.map(form => (
                                  <SelectItem key={form} value={form} className="capitalize">
                                    {form}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => toggleEditMode(index)}
                            className="w-full"
                          >
                            Done editing
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSupplementSelection(index)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              supplement.selected 
                                ? 'border-accent bg-accent' 
                                : 'border-muted-foreground'
                            }`}
                          >
                            {supplement.selected && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{supplement.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {supplement.dosage} • {supplement.form}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleEditMode(index)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                {detectedSupplements.length > 0 && (
                  <Button
                    onClick={handleAddSelected}
                    disabled={isSaving || !detectedSupplements.some(s => s.selected)}
                    className="flex-1 bg-gradient-to-r from-accent-teal to-accent-teal-alt"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Selected
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
