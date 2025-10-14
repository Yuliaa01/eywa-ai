import { Brain, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[28rem] p-0 border-l border-border bg-card"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-border bg-gradient-to-r from-accent-teal/10 to-accent-teal-alt/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center animate-glow-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-rounded font-semibold text-foreground">AI Health Coach</h3>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-accent-teal/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </SheetHeader>

          {/* Chat Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* AI Message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-accent-teal/5 border border-accent-teal/10">
                  <p className="text-sm text-foreground">
                    Hi! I'm your AI health coach. I can help you with:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Health questions & guidance</li>
                    <li>• Symptom tracking</li>
                    <li>• Goal recommendations</li>
                    <li>• Lifestyle optimization</li>
                  </ul>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-rounded font-medium">Quick Actions</p>
                <button className="w-full p-3 rounded-xl bg-card border border-border hover:border-accent-teal/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-foreground font-rounded">
                  💊 Review my supplements
                </button>
                <button className="w-full p-3 rounded-xl bg-card border border-border hover:border-accent-teal/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-foreground font-rounded">
                  📊 Analyze my recent labs
                </button>
                <button className="w-full p-3 rounded-xl bg-card border border-border hover:border-accent-teal/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.08)] transition-all text-left text-sm text-foreground font-rounded">
                  🎯 Optimize my goals
                </button>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/60">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-accent-teal/30 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button className="px-4 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-medium hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-shadow">
                Send
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
