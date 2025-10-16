import { useState } from "react";
import { FileText, Camera, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LabsStepProps {
  onNext: () => void;
}

export default function LabsStep({ onNext }: LabsStepProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'fhir'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create record in uploaded_files table
      const { data: fileRecord, error: dbError } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: user.id,
          name: file.name,
          type: file.type,
          size: file.size,
          storage_path: fileName,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Analyzing Document",
        description: `AI is analyzing ${file.name}...`,
      });

      // Call edge function to analyze the file
      const { error: analyzeError } = await supabase.functions.invoke('analyze-health-file', {
        body: {
          fileId: fileRecord.id,
          filePath: fileName,
          fileName: file.name
        }
      });

      if (analyzeError) throw analyzeError;

      setUploadedFiles(prev => [...prev, file.name]);

      toast({
        title: "Analysis Complete",
        description: "Your lab results have been processed and saved.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#12AFCB]/10 shadow-[0_4px_20px_rgba(18,175,203,0.08)]">
          <FileText className="w-10 h-10 text-[#12AFCB]" />
        </div>
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Import Labs & Records
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Add your lab results for AI analysis
        </p>
      </div>

      <div className="flex gap-2 p-2 rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10">
        {[
          { id: 'upload' as const, label: 'Upload File', icon: Upload },
          { id: 'camera' as const, label: 'Camera Scan', icon: Camera },
          { id: 'fhir' as const, label: 'FHIR/CCDA', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-2xl font-medium text-[0.9375rem] transition-all duration-standard flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_12px_rgba(18,175,203,0.3)]'
                  : 'text-[#5A6B7F] hover:text-[#0E1012]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-standard ${
              uploading 
                ? 'border-[#12AFCB]/40 bg-white/80' 
                : 'border-[#12AFCB]/20 hover:border-[#12AFCB]/40 hover:bg-white/80 cursor-pointer'
            }`}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className={uploading ? '' : 'cursor-pointer'}>
                {uploading ? (
                  <Loader2 className="w-12 h-12 text-[#12AFCB] mx-auto mb-4 animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-[#12AFCB] mx-auto mb-4" />
                )}
                <p className="text-[1.0625rem] font-semibold text-[#0E1012] mb-2">
                  {uploading ? 'Analyzing document...' : 'Drop files here or click to upload'}
                </p>
                <p className="text-[0.875rem] text-[#5A6B7F]">
                  PDF, PNG, or JPG (max 10MB)
                </p>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.875rem] font-medium text-[#0E1012]">Uploaded Files:</p>
                {uploadedFiles.map((fileName, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-white/60 border border-[#12AFCB]/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-[#5A6B7F] truncate">{fileName}</span>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-[0.875rem] text-[#5A6B7F] text-center">
              AI will extract values and match to our test catalog
            </p>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-6 text-center">
            <Camera className="w-16 h-16 text-[#12AFCB] mx-auto" />
            <p className="text-[1.0625rem] text-[#5A6B7F]">
              Camera scanning requires native camera access
            </p>
            <button className="w-full h-14 rounded-3xl bg-white/60 border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:border-[#12AFCB]/20 transition-all duration-standard">
              Enable Camera
            </button>
          </div>
        )}

        {activeTab === 'fhir' && (
          <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-standard ${
              uploading 
                ? 'border-[#12AFCB]/40 bg-white/80' 
                : 'border-[#12AFCB]/20 hover:border-[#12AFCB]/40 hover:bg-white/80 cursor-pointer'
            }`}>
              <input
                type="file"
                accept=".json,.xml"
                onChange={handleFileUpload}
                className="hidden"
                id="fhir-upload"
                disabled={uploading}
              />
              <label htmlFor="fhir-upload" className={uploading ? '' : 'cursor-pointer'}>
                {uploading ? (
                  <Loader2 className="w-12 h-12 text-[#12AFCB] mx-auto mb-4 animate-spin" />
                ) : (
                  <FileText className="w-12 h-12 text-[#12AFCB] mx-auto mb-4" />
                )}
                <p className="text-[1.0625rem] font-semibold text-[#0E1012] mb-2">
                  {uploading ? 'Processing FHIR data...' : 'Upload FHIR Bundle or CCDA'}
                </p>
                <p className="text-[0.875rem] text-[#5A6B7F]">
                  JSON or XML format
                </p>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.875rem] font-medium text-[#0E1012]">Uploaded Files:</p>
                {uploadedFiles.map((fileName, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-white/60 border border-[#12AFCB]/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-[#5A6B7F] truncate">{fileName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard"
        >
          Continue
        </button>

        <button
          onClick={onNext}
          className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard"
        >
          Skip - Add Labs Later
        </button>
      </div>
    </div>
  );
}
