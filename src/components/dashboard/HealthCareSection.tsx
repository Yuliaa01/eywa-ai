import { Heart, MessageCircle, AlertCircle, Sparkles, ChevronRight, Droplet, Moon, Activity, Plus, Calendar, TestTube, FileText, TrendingUp, Pill, Stethoscope } from "lucide-react";
import { IssueModal } from "@/components/modals/IssueModal";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatDrawer from "@/components/ChatDrawer";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function HealthCareSection() {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [biomarkerScores, setBiomarkerScores] = useState<any[]>([]);
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [healthIssues, setHealthIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtiesCount, setSpecialtiesCount] = useState(0);
  const [testOrdersCount, setTestOrdersCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [testReminders, setTestReminders] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [domainScores, setDomainScores] = useState<any>({});
  const [latestReviewer, setLatestReviewer] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Fetch recent vitals
      const { data: vitalData } = await supabase
        .from("vitals_stream")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(5);

      // Fetch supplements
      const { data: supplementData } = await supabase
        .from("supplements")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      // Fetch active health issues
      const { data: issuesData } = await supabase
        .from("health_issues")
        .select("*")
        .eq("user_id", user.id)
        .is("resolved_at", null);

      // Fetch user profile for age calculation
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch doctor reviews for reviewer info
      const { data: reviews } = await supabase
        .from("doctor_reviews")
        .select("*, doctors(name)")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch specialties count
      const { count: specialties } = await supabase
        .from("doctors")
        .select("*", { count: 'exact', head: true })
        .eq("active", true);

      // Fetch pending test orders count
      const { count: pendingTests } = await supabase
        .from("user_test_orders")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "ordered");

      // Process biomarker scores by domain
      const scoresByDomain: any = {};
      if (biomarkers) {
        biomarkers.forEach((score: any) => {
          scoresByDomain[score.domain] = score.score;
        });
      }

      setLabResults(labs || []);
      setBiomarkerScores(biomarkers || []);
      setTestOrders(orders || []);
      setAiFeedback(feedback);
      setVitals(vitalData || []);
      setSupplements(supplementData || []);
      setHealthIssues(issuesData || []);
      setUserProfile(profile);
      setDomainScores(scoresByDomain);
      setLatestReviewer(reviews?.doctors?.name || null);
      setSpecialtiesCount(specialties || 0);
      setTestOrdersCount(pendingTests || 0);
      setUnreadMessagesCount(1); // Mock data
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

  const calculateBiologicalAgeDifference = () => {
    if (!userProfile?.dob || !userProfile?.biological_age_estimate) return null;
    
    const birthDate = new Date(userProfile.dob);
    const today = new Date();
    const chronologicalAge = differenceInDays(today, birthDate) / 365.25;
    const biologicalAge = userProfile.biological_age_estimate;
    const difference = chronologicalAge - biologicalAge;
    
    return {
      chronologicalAge: Math.floor(chronologicalAge),
      biologicalAge: Math.floor(biologicalAge),
      difference: parseFloat(difference.toFixed(1)),
      isYounger: difference > 0
    };
  };

  const getOverallHealthStatus = () => {
    const scores = Object.values(domainScores) as number[];
    if (scores.length === 0) return { status: "No Data", color: "text-muted-foreground" };
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (avgScore >= 80) return { status: "Excellent", color: "text-green-600" };
    if (avgScore >= 70) return { status: "Within Range", color: "text-accent-teal" };
    if (avgScore >= 60) return { status: "Needs Attention", color: "text-yellow-600" };
    return { status: "Needs Improvement", color: "text-red-600" };
  };

  const getDomainIcon = (domain: string) => {
    const iconMap: any = {
      cardio_resp: "❤️",
      metabolic_lipids: "🔥",
      inflammation_immunity: "🛡️",
      hormones: "⚡"
    };
    return iconMap[domain] || "📊";
  };

  const getDomainName = (domain: string) => {
    const nameMap: any = {
      cardio_resp: "Heart Health",
      metabolic_lipids: "Metabolic",
      inflammation_immunity: "Inflammation",
      hormones: "Hormonal"
    };
    return nameMap[domain] || domain;
  };

  // Mock data generators for when no real data exists
  const getMockLabResults = () => {
    const now = new Date();
    return [
      { test_code: "CBC", reported_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
      { test_code: "CMP", reported_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString() },
      { test_code: "Lipid Panel", reported_at: new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString() },
      { test_code: "HbA1c", reported_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString() },
      { test_code: "TSH", reported_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString() },
      { test_code: "Vitamin D", reported_at: new Date(now.getTime() - 189 * 24 * 60 * 60 * 1000).toISOString(), collected_at: new Date(now.getTime() - 189 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  };

  const getMockBiomarkerScores = () => ({
    cardio_resp: 78,
    metabolic_lipids: 72,
    inflammation_immunity: 85,
    hormones: 68
  });

  const getMockUserProfile = () => ({
    dob: "1990-05-15",
    biological_age_estimate: 25,
    first_name: "Demo",
    last_name: "User"
  });

  // Determine if we're using mock data
  const usingMockData = labResults.length === 0 && biomarkerScores.length === 0;
  
  // Use real data or fallback to mock
  const displayLabResults = labResults.length > 0 ? labResults : getMockLabResults();
  const displayDomainScores = Object.keys(domainScores).length > 0 ? domainScores : getMockBiomarkerScores();
  const displayUserProfile = userProfile || getMockUserProfile();
  const displayReviewer = latestReviewer || "Dr. Sarah Johnson, MD";

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
      {/* AI Analysis Summary */}
      {aiFeedback && (
        <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 via-accent-teal-alt/5 to-transparent backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_8px_40px_rgba(18,175,203,0.15)]">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-teal-alt flex items-center justify-center animate-glow-pulse flex-shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-rounded text-2xl font-bold text-foreground">
                  AI Health Analysis
                </h3>
                <div className="px-3 py-1 rounded-lg bg-accent-teal/10 text-accent-teal text-xs font-rounded font-semibold">
                  Latest
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Generated {format(new Date(aiFeedback.generated_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Summary */}
          {aiFeedback.summary_md && (
            <div className="p-6 rounded-2xl bg-card/80 border border-border mb-6">
              <h4 className="font-rounded font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-teal" />
                Medical Summary
              </h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {aiFeedback.summary_md}
              </p>
            </div>
          )}

          {/* AI Recommendations */}
          {aiFeedback.next_best_actions && (
            <div className="p-6 rounded-2xl bg-card/80 border border-border">
              <h4 className="font-rounded font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-teal" />
                Recommended Actions
              </h4>
              <div className="space-y-3">
                {typeof aiFeedback.next_best_actions === 'string' 
                  ? JSON.parse(aiFeedback.next_best_actions).map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-accent-teal/5 to-transparent border border-accent-teal/10 hover:border-accent-teal/20 transition-all">
                        <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent-teal">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground flex-1">{action}</p>
                      </div>
                    ))
                  : Array.isArray(aiFeedback.next_best_actions) 
                  ? aiFeedback.next_best_actions.map((action: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-accent-teal/5 to-transparent border border-accent-teal/10 hover:border-accent-teal/20 transition-all">
                        <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent-teal">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground flex-1">
                          {typeof action === 'string' ? action : action.title || action.action}
                        </p>
                      </div>
                    ))
                  : null
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Results Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent backdrop-blur-xl border border-purple-500/20 p-8 shadow-[0_8px_40px_rgba(147,51,234,0.15)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-rounded text-2xl font-bold text-foreground">
              My Results
            </h3>
            {usingMockData && (
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-rounded font-semibold">
                Sample Data
              </span>
            )}
          </div>
            <button 
              onClick={() => navigate("/doctor-hub")}
              className="text-sm text-accent-teal hover:text-accent-teal-alt transition-colors flex items-center gap-1"
            >
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline of Recent Tests */}
          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {displayLabResults.slice(0, 6).map((lab: any, idx: number) => (
                  <button
                    key={idx}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      idx === 0 
                        ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' 
                        : 'bg-card/60 border-border text-muted-foreground hover:border-accent-teal/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <TestTube className="w-4 h-4" />
                      <span className="text-xs font-rounded font-medium">
                        {format(new Date(lab.reported_at), "MMM d")}
                      </span>
                    </div>
                  </button>
              ))}
            </div>
          </div>

          {/* Test Report Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent border border-purple-500/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">Patient Age</div>
                <div className="text-sm font-rounded font-bold text-foreground">
                  {(() => {
                    const ageData = calculateBiologicalAgeDifference();
                    if (ageData) return `${ageData.chronologicalAge} years old`;
                    const birthDate = new Date(displayUserProfile.dob);
                    const age = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    return `${age} years old`;
                  })()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/10">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">Report Type</div>
                <div className="text-sm font-rounded font-bold text-foreground">Core Health Test</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-accent-teal/5 to-transparent border border-accent-teal/10">
              <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-accent-teal" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-0.5">Reviewed By</div>
                <div className="text-sm font-rounded font-bold text-foreground">{displayReviewer}</div>
              </div>
            </div>

            {displayLabResults[0]?.reported_at && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/10">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-0.5">Result Date</div>
                  <div className="text-sm font-rounded font-bold text-foreground">
                    {format(new Date(displayLabResults[0].reported_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Biomarker Summary and Biological Age */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Biomarker Summary */}
            <div className="p-6 rounded-2xl bg-card/60 border border-border">
              <h4 className="font-rounded font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Biomarker Summary
              </h4>
              
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-rounded font-bold ${(() => {
                    const scores = Object.values(displayDomainScores) as number[];
                    if (scores.length === 0) return "text-muted-foreground";
                    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                    if (avgScore >= 80) return "text-green-600";
                    if (avgScore >= 70) return "text-accent-teal";
                    if (avgScore >= 60) return "text-yellow-600";
                    return "text-red-600";
                  })()}`}>
                    {(() => {
                      const scores = Object.values(displayDomainScores) as number[];
                      if (scores.length === 0) return "No Data";
                      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                      if (avgScore >= 80) return "Excellent";
                      if (avgScore >= 70) return "Within Range";
                      if (avgScore >= 60) return "Needs Attention";
                      return "Needs Improvement";
                    })()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Based on latest biomarkers
                </span>
              </div>

              <div className="space-y-3">
                {Object.entries(displayDomainScores).map(([domain, score]: [string, any]) => (
                  <div key={domain} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getDomainIcon(domain)}</span>
                      <span className="text-sm font-rounded font-medium text-foreground">
                        {getDomainName(domain)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-rounded font-bold text-purple-500">
                        {score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biological Age Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">🏅</div>
                <h4 className="font-rounded font-semibold text-foreground">
                  Biological Age
                </h4>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-5xl font-rounded font-bold text-foreground mb-2">
                  {(() => {
                    const ageData = calculateBiologicalAgeDifference();
                    if (ageData) return ageData.biologicalAge;
                    return Math.floor(displayUserProfile.biological_age_estimate);
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Your biological age is {(() => {
                    const ageData = calculateBiologicalAgeDifference();
                    if (ageData) return Math.abs(ageData.difference);
                    const birthDate = new Date(displayUserProfile.dob);
                    const chronologicalAge = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                    return Math.abs(parseFloat((chronologicalAge - displayUserProfile.biological_age_estimate).toFixed(1)));
                  })()} years{' '}
                  {(() => {
                    const ageData = calculateBiologicalAgeDifference();
                    if (ageData) return ageData.isYounger ? 'younger' : 'older';
                    const birthDate = new Date(displayUserProfile.dob);
                    const chronologicalAge = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                    return chronologicalAge > displayUserProfile.biological_age_estimate ? 'younger' : 'older';
                  })()} than your chronological age
                </p>
              </div>

              <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-foreground font-rounded font-medium hover:shadow-[0_4px_20px_rgba(234,179,8,0.3)] transition-all text-sm">
                SHARE
              </button>
            </div>
          </div>
        </div>

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

          {/* DoctorHub Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Available Specialties */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {specialtiesCount}
              </div>
              <div className="text-xs text-muted-foreground">Available<br/>Specialties</div>
            </div>

            {/* Pending Test Orders */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {testOrdersCount}
              </div>
              <div className="text-xs text-muted-foreground">Pending<br/>Test Orders</div>
            </div>

            {/* Unread Messages */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {unreadMessagesCount}
              </div>
              <div className="text-xs text-muted-foreground">Unread<br/>Messages</div>
            </div>

            {/* Active Health Issues */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {healthIssues.length}
              </div>
              <div className="text-xs text-muted-foreground">Active<br/>Health Issues</div>
            </div>
          </div>

          <button 
            onClick={() => navigate("/doctor-hub")}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-semibold shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
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
