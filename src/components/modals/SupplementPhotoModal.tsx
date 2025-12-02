import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, Check, Plus } from "lucide-react";
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
}

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
        setDetectedSupplements(data.supplements.map((s: any) => ({ ...s, selected: true })));
        toast({
          title: "Supplements detected",
          description: `Found ${data.supplements.length} supplement(s) in your photo.`,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-rounded">Analyze Supplement Photo</DialogTitle>
          <DialogDescription>
            Take a photo of your supplement bottles and we'll automatically detect and add them.
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
                  className="w-full h-48 object-cover"
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
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Detected Supplements:</p>
                  {detectedSupplements.map((supplement, index) => (
                    <button
                      key={index}
                      onClick={() => toggleSupplementSelection(index)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        supplement.selected 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{supplement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplement.dosage} • {supplement.form}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          supplement.selected 
                            ? 'border-accent bg-accent' 
                            : 'border-muted-foreground'
                        }`}>
                          {supplement.selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </button>
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
