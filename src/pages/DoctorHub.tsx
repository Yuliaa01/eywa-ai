import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassToolbar } from "@/components/glass/GlassToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, FileDown, Search, ArrowLeft } from "lucide-react";
import SpecialtiesTab from "@/components/doctorhub/SpecialtiesTab";
import TestsOrdersTab from "@/components/doctorhub/TestsOrdersTab";
import MessagesTab from "@/components/doctorhub/MessagesTab";
import NotesTab from "@/components/doctorhub/NotesTab";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DoctorHub() {
  const [activeTab, setActiveTab] = useState("specialties");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to export your health data.",
          variant: "destructive"
        });
        return;
      }

      // Fetch all health data
      const [labResults, biomarkerScores, userProfile, supplements, healthIssues] = await Promise.all([
        supabase.from("lab_results").select("*").eq("user_id", user.id).order("reported_at", { ascending: false }),
        supabase.from("biomarker_scores").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("supplements").select("*").eq("user_id", user.id).is("deleted_at", null),
        supabase.from("health_issues").select("*").eq("user_id", user.id).is("resolved_at", null)
      ]);

      // Generate PDF content as HTML
      const htmlContent = generateHealthReportHTML({
        profile: userProfile.data,
        labs: labResults.data || [],
        biomarkers: biomarkerScores.data || [],
        supplements: supplements.data || [],
        issues: healthIssues.data || []
      });

      // Create a printable window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({
        title: "Export initiated",
        description: "Your health report is ready to print or save as PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Unable to export health data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewImport = () => {
    setUploadModalOpen(true);
  };

  const generateHealthReportHTML = (data: any) => {
    const { profile, labs, biomarkers, supplements, issues } = data;
    const reportDate = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Health Report - ${profile?.first_name || 'User'} ${profile?.last_name || ''}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 1200px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }
            h1 { color: #12AFCB; font-size: 32px; margin-bottom: 8px; }
            h2 { color: #0E1012; font-size: 24px; margin-top: 32px; border-bottom: 2px solid #12AFCB; padding-bottom: 8px; }
            h3 { color: #5A6B7F; font-size: 18px; margin-top: 24px; }
            .header { margin-bottom: 40px; border-bottom: 3px solid #12AFCB; padding-bottom: 20px; }
            .meta { color: #5A6B7F; font-size: 14px; }
            .section { margin-bottom: 32px; }
            .test-item { 
              display: flex;
              justify-content: space-between;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              align-items: center;
            }
            .test-name { font-weight: 600; color: #0E1012; }
            .test-value { font-weight: 700; color: #12AFCB; }
            .test-reference { color: #5A6B7F; font-size: 12px; }
            .status-dot {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              display: inline-block;
              margin-left: 8px;
            }
            .status-normal { background-color: #22c55e; }
            .status-warning { background-color: #f97316; }
            .status-critical { background-color: #ef4444; }
            .biomarker-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin-top: 16px;
            }
            .biomarker-card {
              padding: 16px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              text-align: center;
            }
            .biomarker-score {
              font-size: 36px;
              font-weight: 700;
              color: #12AFCB;
            }
            .biomarker-domain {
              font-size: 14px;
              color: #5A6B7F;
              text-transform: capitalize;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Health Report</h1>
            <div class="meta">
              Patient: ${profile?.first_name || 'User'} ${profile?.last_name || ''}<br>
              Generated: ${reportDate}
            </div>
          </div>

          ${biomarkers.length > 0 ? `
            <div class="section">
              <h2>Biomarker Scores</h2>
              <div class="biomarker-grid">
                ${biomarkers.map((b: any) => `
                  <div class="biomarker-card">
                    <div class="biomarker-score">${b.score}</div>
                    <div class="biomarker-domain">${b.domain.replace(/_/g, ' ')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${labs.length > 0 ? `
            <div class="section">
              <h2>Laboratory Results</h2>
              ${labs.map((lab: any) => {
                let statusClass = 'status-normal';
                if (lab.value_num && lab.reference_low && lab.reference_high) {
                  const value = parseFloat(lab.value_num);
                  const low = parseFloat(lab.reference_low);
                  const high = parseFloat(lab.reference_high);
                  if (value < low * 0.9 || value > high * 1.1) statusClass = 'status-critical';
                  else if (value < low || value > high) statusClass = 'status-warning';
                }
                return `
                  <div class="test-item">
                    <div>
                      <div class="test-name">${lab.test_code}</div>
                      ${lab.reference_low && lab.reference_high ? 
                        `<div class="test-reference">Reference: ${lab.reference_low} - ${lab.reference_high} ${lab.units || ''}</div>` 
                        : ''}
                    </div>
                    <div style="text-align: right;">
                      <span class="test-value">${lab.value_num || lab.value_text} ${lab.units || ''}</span>
                      <span class="status-dot ${statusClass}"></span>
                      <div class="test-reference">${format(new Date(lab.reported_at), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          ${supplements.length > 0 ? `
            <div class="section">
              <h2>Current Supplements</h2>
              ${supplements.map((supp: any) => `
                <div class="test-item">
                  <div class="test-name">${supp.name}</div>
                  <div class="test-value">${supp.dosage || ''} ${supp.units || ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${issues.length > 0 ? `
            <div class="section">
              <h2>Active Health Concerns</h2>
              ${issues.map((issue: any) => `
                <div class="test-item">
                  <div>
                    <div class="test-name">${issue.title}</div>
                    <div class="test-reference">${issue.category}</div>
                  </div>
                  <div class="test-value">Severity: ${issue.severity || 'N/A'}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="section" style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p class="meta">
              This report is generated from your health data and should be reviewed with your healthcare provider.
              Always consult with medical professionals before making health decisions.
            </p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30 pb-24">
      {/* Glass Toolbar */}
      <GlassToolbar position="top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl hover:bg-[#12AFCB]/10"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A6B7F]" />
          </Button>
          <h1 className="font-rounded text-xl font-semibold text-[#0E1012]">
            DoctorHub
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewImport}
            className="rounded-xl hover:bg-[#12AFCB]/10"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="rounded-xl hover:bg-[#12AFCB]/10 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </GlassToolbar>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6B7F]" />
          <Input
            type="text"
            placeholder="Search doctors, tests, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border-[#12AFCB]/10 focus:border-[#12AFCB]/30"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-4 bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-1.5 rounded-3xl h-auto">
            <TabsTrigger
              value="specialties"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              Specialties
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              Tests & Orders
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-2xl font-rounded font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#12AFCB] data-[state=active]:to-[#12AFCB]/90 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-all duration-300 py-3"
            >
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="specialties" className="animate-scale-in">
            <SpecialtiesTab searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="tests" className="animate-scale-in">
            <TestsOrdersTab />
          </TabsContent>

          <TabsContent value="messages" className="animate-scale-in">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="notes" className="animate-scale-in">
            <NotesTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
      />
    </div>
  );
}
