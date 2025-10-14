import { GlassCard } from "@/components/glass/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle } from "lucide-react";

// Mock messages data
const messages = [
  {
    id: "1",
    title: "Lab Results Available",
    content: "Your recent blood work results have been processed and are ready for review.",
    type: "result",
    timestamp: "2024-01-20T10:30:00Z",
    read: false,
  },
  {
    id: "2",
    title: "Test Reminder",
    content: "Your quarterly lipid panel is due next week. Schedule your appointment soon.",
    type: "reminder",
    timestamp: "2024-01-19T14:00:00Z",
    read: true,
  },
  {
    id: "3",
    title: "Data Import Successful",
    content: "Your FHIR records from ABC Health have been successfully imported.",
    type: "system",
    timestamp: "2024-01-18T09:15:00Z",
    read: true,
  },
];

const typeColors = {
  result: "bg-blue-500/10 text-blue-600",
  reminder: "bg-orange-500/10 text-orange-600",
  system: "bg-[#12AFCB]/10 text-[#12AFCB]",
};

export default function MessagesTab() {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <GlassCard
          key={message.id}
          className={`p-4 ${!message.read ? "border-[#12AFCB]/30" : ""}`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[message.type as keyof typeof typeColors]}`}>
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-rounded font-semibold text-[#0E1012]">
                  {message.title}
                </h4>
                {!message.read && (
                  <Badge className="bg-[#12AFCB]/10 text-[#12AFCB] border-0 text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#5A6B7F] mb-3">{message.content}</p>
              <div className="flex items-center gap-2 text-xs text-[#5A6B7F]">
                <Clock className="w-3 h-3" />
                {new Date(message.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </GlassCard>
      ))}

      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#12AFCB]" />
          </div>
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">
            All Caught Up
          </h3>
          <p className="text-sm text-[#5A6B7F]">
            You have no new messages at this time.
          </p>
        </div>
      )}
    </div>
  );
}
