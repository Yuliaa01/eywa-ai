import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, Calendar, ShoppingCart } from "lucide-react";

interface Test {
  id: string;
  code: string;
  name: string;
  domain: string;
  analyte_type: string;
  suggested_cadence: string | null;
  primary_purpose: string | null;
  units: string | null;
}

export default function TestsOrdersTab() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from("tests_catalog")
        .select("*")
        .order("name");

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const domains = ["all", ...new Set(tests.map((t) => t.domain))];
  const filteredTests = selectedDomain === "all" 
    ? tests 
    : tests.filter((t) => t.domain === selectedDomain);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Filters */}
      <div className="flex flex-wrap gap-2">
        {domains.map((domain) => (
          <Badge
            key={domain}
            variant={selectedDomain === domain ? "default" : "outline"}
            className={`cursor-pointer rounded-full px-4 py-2 transition-all ${
              selectedDomain === domain
                ? "bg-[#12AFCB] text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
                : "bg-white/60 text-[#5A6B7F] hover:bg-white/80"
            }`}
            onClick={() => setSelectedDomain(domain)}
          >
            {domain.replace(/_/g, " ")}
          </Badge>
        ))}
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {filteredTests.map((test) => (
          <GlassCard key={test.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <TestTube className="w-6 h-6 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">
                      {test.name}
                    </h4>
                    <p className="text-xs text-[#5A6B7F]">Code: {test.code}</p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs bg-[#12AFCB]/5 text-[#12AFCB]">
                    {test.domain.replace(/_/g, " ")}
                  </Badge>
                  {test.suggested_cadence && (
                    <Badge variant="outline" className="text-xs bg-white/60">
                      <Calendar className="w-3 h-3 mr-1" />
                      {test.suggested_cadence}
                    </Badge>
                  )}
                </div>
                {test.primary_purpose && (
                  <p className="text-xs text-[#5A6B7F] mt-2">{test.primary_purpose}</p>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#5A6B7F]">No tests found in this category.</p>
        </div>
      )}
    </div>
  );
}
