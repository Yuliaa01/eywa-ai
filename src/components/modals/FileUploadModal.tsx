import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FileUploadModal({ open, onOpenChange, onSuccess }: FileUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 20MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Get current session and refresh if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        window.location.href = '/auth';
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Authentication error",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        window.location.href = '/auth';
        return;
      }

      // Upload to storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

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

      toast({
        title: "File uploaded successfully",
        description: "Processing and analyzing your health data...",
      });

      setUploading(false);
      setAnalyzing(true);

      // Call AI analysis function
      const { data, error: analysisError } = await supabase.functions.invoke('analyze-health-file', {
        body: { fileId: fileRecord.id, filePath, fileName: file.name }
      });

      if (analysisError) throw analysisError;

      toast({
        title: "Analysis complete",
        description: data.summary || "Your health data has been analyzed and stored.",
      });

      onSuccess?.();
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload and analyze file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rounded">Upload Health Records</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Upload lab results, medical reports, or health scans. Our AI will analyze the data and provide personalized insights.
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-accent-teal/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-accent-teal" />
                <div className="text-left">
                  <div className="font-medium text-foreground">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <div className="font-medium text-foreground mb-1">
                  Click to select file
                </div>
                <div className="text-sm text-muted-foreground">
                  PDF or images (JPG, PNG) up to 20MB
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setFile(null);
              }}
              className="flex-1"
              disabled={uploading || analyzing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              className="flex-1"
              disabled={!file || uploading || analyzing}
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Uploading..." : analyzing ? "Analyzing..." : "Upload & Analyze"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
