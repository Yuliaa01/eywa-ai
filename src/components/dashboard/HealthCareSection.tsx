import { Heart, MessageCircle, AlertCircle, Sparkles, ChevronRight, Droplet, Moon, Activity, Plus, Calendar, TestTube, FileText, TrendingUp } from "lucide-react";
import { IssueModal } from "@/components/modals/IssueModal";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatDrawer from "@/components/ChatDrawer";
import { format, differenceInDays } from "date-fns";

export default function HealthCareSection() {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [biomarkerScores, setBiomarkerScores] = useState<any[]>([]);
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHealthData();

    // Subscribe to uploaded_files changes for real-time updates
    const channel = supabase
      .channel('uploaded_files_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'uploaded_files',
          filter: `status=eq.parsed`
        },
        () => {
          console.log('File parsed, refreshing health data...');
          loadHealthData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch lab results
      const { data: labs } = await supabase
        .from("lab_results")
        .select("*")
        .eq("user_id", user.id)
        .order("reported_at", { ascending: false })
        .limit(10);

      // Fetch biomarker scores
      const { data: biomarkers } = await supabase
        .from("biomarker_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch test orders
      const { data: orders } = await supabase
        .from("user_test_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch latest AI feedback
      const { data: feedback } = await supabase
        .from("ai_feedback_unified")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLabResults(labs || []);
      setBiomarkerScores(biomarkers || []);
      setTestOrders(orders || []);
      setAiFeedback(feedback);
    } catch (error) {
      console.error("Error loading health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTestReminders = () => {
    const reminders: any[] = [];
    
    // Check for pending test orders
    testOrders.filter(order => order.status === 'ordered' || order.status === 'pending').forEach(order => {
      reminders.push({
        type: 'pending_order',
        testCode: order.test_code,
        status: order.status,
        date: order.created_at
      });
    });

    // Check for overdue tests based on last lab results
    const now = new Date();
    
    labResults.forEach(lab => {
      const daysSinceTest = differenceInDays(now, new Date(lab.reported_at));
      let dueInDays = null;
      
      // Basic cadence estimates (can be enhanced with tests_catalog)
      if (lab.test_code.includes('HbA1c') && daysSinceTest > 90) {
        dueInDays = 180 - daysSinceTest;
      } else if (lab.test_code.includes('TSH') && daysSinceTest > 180) {
        dueInDays = 365 - daysSinceTest;
      } else if (lab.test_code.includes('CBC') && daysSinceTest > 180) {
        dueInDays = 365 - daysSinceTest;
      }
      
      if (dueInDays !== null && !reminders.some(r => r.testCode === lab.test_code)) {
        reminders.push({
          type: 'recheck_due',
          testCode: lab.test_code,
          dueInDays,
          lastTest: lab.reported_at
        });
      }
    });

    return reminders;
  };

  const getLatestLabSummary = () => {
    if (labResults.length === 0) return null;
    
    const recentLabs = labResults.slice(0, 5);
    const latestDate = labResults[0]?.reported_at;
    
    return {
      date: latestDate,
      count: recentLabs.length,
      labs: recentLabs
    };
  };

  const quickChecks = [
    {
      title: "Feeling Anxious?",
      description: "Quick self-assessment",
      icon: AlertCircle,
      color: "#12AFCB",
    },
    {
      title: "Body Discomfort?",
      description: "Log symptoms",
      icon: Activity,
      color: "#19D0E4",
    },
  ];

  const tipCards = [
    {
      title: "Hydration Low Today",
      description: "You've had 1.2L. Goal is 2.5L.",
      icon: Droplet,
      action: "Log Water",
    },
    {
      title: "Try 10-Min Meditation",
      description: "Your HRV suggests you could benefit from relaxation.",
      icon: Moon,
      action: "Start Session",
    },
    {
      title: "Schedule Recovery Day",
      description: "You've trained 6 days straight. Consider active recovery.",
      icon: Heart,
      action: "View Plan",
    },
  ];

  const labSummary = getLatestLabSummary();
  const testReminders = getTestReminders();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center animate-glow-pulse">
          <Activity className="w-6 h-6 text-accent-teal animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Medical Overview Card */}
      {labSummary ? (
        <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-rounded text-xl font-semibold text-foreground mb-2">
                Latest Medical Overview
              </h3>
              <p className="text-sm text-muted-foreground">
                Last sync: {format(new Date(labSummary.date), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-accent-teal/10 border border-accent-teal/20">
              <span className="text-sm font-rounded font-semibold text-accent-teal">
                {labSummary.count} Results
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {labSummary.labs.slice(0, 4).map((lab: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border hover:border-accent-teal/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-rounded font-medium text-foreground">
                    {lab.test_code}
                  </span>
                  <TestTube className="w-4 h-4 text-accent-teal" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-rounded font-bold text-foreground">
                    {lab.value_num || lab.value_text}
                  </span>
                  {lab.units && (
                    <span className="text-sm text-muted-foreground">{lab.units}</span>
                  )}
                </div>
                {(lab.reference_low || lab.reference_high) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Reference: {lab.reference_low}-{lab.reference_high}
                  </div>
                )}
              </div>
            ))}
          </div>

          {biomarkerScores.length > 0 && (
            <div className="p-6 rounded-2xl bg-card/80 border border-border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-accent-teal" />
                <h4 className="font-rounded font-semibold text-foreground">Health Scores</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {biomarkerScores.slice(0, 4).map((score: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl font-rounded font-bold text-accent-teal mb-1">
                      {score.score}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {score.domain}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="w-full px-6 py-3 rounded-xl bg-card border border-accent-teal/20 text-accent-teal font-rounded font-medium hover:bg-accent-teal/5 transition-colors">
            View Full Report
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-teal/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-accent-teal" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-foreground mb-2">
            No Medical Data Yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Upload a lab report or connect your health records to begin tracking your health metrics.
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setUploadModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-medium hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-shadow"
            >
              Upload File
            </button>
            <button 
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "EHR integration will be available soon. Use 'Upload File' for now.",
                });
              }}
              className="px-6 py-3 rounded-xl bg-card border border-accent-teal/20 text-accent-teal font-rounded font-medium hover:bg-accent-teal/5 transition-colors"
            >
              Connect EHR
            </button>
          </div>
        </div>
      )}

      {/* Test Reminders */}
      {testReminders.length > 0 && (
        <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent-teal" />
            </div>
            <h3 className="font-rounded text-xl font-semibold text-foreground">Test Reminders</h3>
          </div>
          <div className="space-y-3">
            {testReminders.slice(0, 5).map((reminder: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-card border border-border hover:border-accent-teal/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                      <TestTube className="w-5 h-5 text-accent-teal" />
                    </div>
                    <div>
                      <h4 className="font-rounded font-semibold text-foreground">
                        {reminder.testCode}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {reminder.type === 'pending_order'
                          ? `Status: ${reminder.status}`
                          : reminder.dueInDays > 0
                          ? `Due in ${reminder.dueInDays} days`
                          : `Overdue by ${Math.abs(reminder.dueInDays)} days`}
                      </p>
                    </div>
                  </div>
                  {reminder.type === 'recheck_due' && reminder.dueInDays <= 30 && (
                    <div className="px-3 py-1 rounded-lg bg-accent-teal/10 text-accent-teal text-xs font-rounded font-semibold">
                      {reminder.dueInDays <= 0 ? 'Overdue' : 'Soon'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Health Agent */}
      <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center animate-glow-pulse flex-shrink-0">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-rounded text-xl font-semibold text-foreground mb-2">
              ⭐ AI Health Coach
            </h3>
            <p className="text-muted-foreground mb-4">
              I can analyze your lab results, biomarkers, and health data to provide personalized medical guidance.
            </p>
            <button
              onClick={() => setChatOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-semibold shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Quick Self-Checks */}
      <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-foreground">Quick Check-Ins</h3>
          <button 
            onClick={() => setIssueModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-accent-teal" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {quickChecks.map((check) => (
            <button
              key={check.title}
              onClick={() => {
                setIssueModalOpen(true);
              }}
              className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border hover:border-accent-teal/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                    <check.icon className="w-6 h-6 text-accent-teal" />
                  </div>
                  <div>
                    <h4 className="font-rounded font-semibold text-foreground mb-1">{check.title}</h4>
                    <p className="text-sm text-muted-foreground">{check.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent-teal group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Feedback Panel */}
      <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-teal" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-foreground">Doctor Feedback</h3>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-accent-teal/5 to-accent-teal-alt/5 border border-accent-teal/10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-card/60 flex items-center justify-center">
            <Heart className="w-8 h-8 text-accent-teal" />
          </div>
          <h4 className="font-rounded font-semibold text-foreground mb-2">
            Connect with Specialists
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Get personalized feedback from endocrinologists, cardiologists, and longevity doctors.
          </p>
          <button className="px-6 py-2.5 rounded-xl bg-card border border-accent-teal/20 text-accent-teal font-rounded font-medium hover:bg-accent-teal/5 transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      {/* Tip Cards */}
      <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="font-rounded text-xl font-semibold text-foreground mb-6">Health Tips</h3>
        <div className="space-y-4">
          {tipCards.map((tip, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-card/80 border border-border hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                  <tip.icon className="w-6 h-6 text-accent-teal" />
                </div>
                <div className="flex-1">
                  <h4 className="font-rounded font-semibold text-foreground mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{tip.description}</p>
                  <button className="px-4 py-2 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal font-rounded font-medium text-sm transition-colors">
                    {tip.action}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <IssueModal 
        open={issueModalOpen} 
        onOpenChange={setIssueModalOpen} 
        onSuccess={loadHealthData} 
      />
      <FileUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadHealthData}
      />
      <ChatDrawer 
        open={chatOpen} 
        onClose={() => setChatOpen(false)}
        initialMessage="Review my latest health data and tell me what I should improve next."
      />
    </div>
  );
}
