import { useState } from "react";
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

export default function DoctorHub() {
  const [activeTab, setActiveTab] = useState("specialties");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting PDF...");
  };

  const handleNewImport = () => {
    // TODO: Implement FHIR/file import
    console.log("Importing data...");
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
            className="rounded-xl hover:bg-[#12AFCB]/10"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
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
    </div>
  );
}
