import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Plus } from "lucide-react";
import RiskChip from "./RiskChip";
import ActionList from "./ActionList";
import RefRangeTag from "./RefRangeTag";

interface Specialty {
  id: string;
  name: string;
  specialty: string;
}

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  specialty: Specialty;
}

// Mock data for demonstration
const mockData = {
  status: "Your cardiovascular metrics show good overall trends with some areas for optimization. Blood pressure is well-controlled, but lipid profile could be improved.",
  riskSignals: [
    { title: "Elevated LDL", severity: "medium" as const, description: "LDL cholesterol is slightly above optimal range" },
    { title: "Low VO₂ max", severity: "low" as const, description: "Cardiorespiratory fitness could be improved" },
  ],
  nextSteps: [
    { title: "Increase aerobic exercise", description: "Aim for 150 min/week moderate intensity", priority: "high" as const },
    { title: "Adjust diet", description: "Reduce saturated fat intake", priority: "medium" as const },
    { title: "Consider statin", description: "Discuss with your doctor", priority: "low" as const },
  ],
  recentLabs: [
    { name: "LDL Cholesterol", value: 135, unit: "mg/dL", refLow: 0, refHigh: 100, date: "2024-01-15" },
    { name: "HDL Cholesterol", value: 55, unit: "mg/dL", refLow: 40, refHigh: 999, date: "2024-01-15" },
    { name: "A1c", value: 5.4, unit: "%", refLow: 0, refHigh: 5.7, date: "2024-01-15" },
  ],
  vitals: [
    { name: "Blood Pressure", value: "118/75", date: "2024-01-20" },
    { name: "Resting Heart Rate", value: "62 bpm", date: "2024-01-20" },
  ],
};

export default function EvidenceDrawer({ isOpen, onClose, specialty }: EvidenceDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-gradient-to-br from-[#F8FCFF] via-[#EFF8FB] to-[#E8FAFF]/30">
        <SheetHeader>
          <SheetTitle className="font-rounded text-2xl font-semibold text-[#0E1012]">
            {specialty.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Summary */}
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10">
            <h3 className="font-rounded font-semibold text-[#0E1012] mb-2">Status</h3>
            <p className="text-sm text-[#5A6B7F]">{mockData.status}</p>
          </div>

          {/* Risk Signals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="font-rounded font-semibold text-[#0E1012]">Risk Signals</h3>
            </div>
            <div className="space-y-2">
              {mockData.riskSignals.map((signal, index) => (
                <RiskChip key={index} {...signal} />
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#12AFCB]" />
                <h3 className="font-rounded font-semibold text-[#0E1012]">Next Steps</h3>
              </div>
            </div>
            <ActionList actions={mockData.nextSteps} />
          </div>

          {/* Recent Labs */}
          <div>
            <h3 className="font-rounded font-semibold text-[#0E1012] mb-3">Recent Labs</h3>
            <div className="space-y-2">
              {mockData.recentLabs.map((lab, index) => (
                <div key={index} className="p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0E1012]">{lab.name}</span>
                    <RefRangeTag value={lab.value} refLow={lab.refLow} refHigh={lab.refHigh} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5A6B7F]">
                    <span>
                      {lab.value} {lab.unit}
                    </span>
                    <span>{lab.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Vitals */}
          <div>
            <h3 className="font-rounded font-semibold text-[#0E1012] mb-3">Recent Vitals</h3>
            <div className="space-y-2">
              {mockData.vitals.map((vital, index) => (
                <div key={index} className="p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#0E1012]">{vital.name}</span>
                    <span className="text-sm text-[#5A6B7F]">{vital.value}</span>
                  </div>
                  <p className="text-xs text-[#5A6B7F] mt-1">{vital.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Suggested */}
          <div className="p-4 rounded-2xl bg-[#12AFCB]/5 border border-[#12AFCB]/10">
            <h4 className="font-rounded font-medium text-[#0E1012] mb-2">Why Suggested?</h4>
            <p className="text-xs text-[#5A6B7F]">
              Recommendations based on: LDL {mockData.recentLabs[0].value} mg/dL (Jan 15), 
              HDL {mockData.recentLabs[1].value} mg/dL (Jan 15), A1c {mockData.recentLabs[2].value}% (Jan 15)
            </p>
          </div>

          {/* Safety Banner */}
          <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-[#5A6B7F]">
              <strong>Educational insights only</strong> — not medical advice. 
              If urgent symptoms, call emergency services.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
