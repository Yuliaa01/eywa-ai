import { Heart, MessageCircle, AlertCircle, Sparkles, ChevronRight, Droplet, Moon, Activity, Plus, Calendar, TestTube, FileText, TrendingUp, Pill, Stethoscope, Info, ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import { IssueModal } from "@/components/modals/IssueModal";
import { FileUploadModal } from "@/components/modals/FileUploadModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatDrawer from "@/components/ChatDrawer";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [expandedTestCategory, setExpandedTestCategory] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    loadHealthData();

    // Subscribe to uploaded_files changes for real-time updates
    const channel = supabase.channel('uploaded_files_changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'uploaded_files',
      filter: `status=eq.parsed`
    }, () => {
      console.log('File parsed, refreshing health data...');
      loadHealthData();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const loadHealthData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch lab results
      const {
        data: labs
      } = await supabase.from("lab_results").select("*").eq("user_id", user.id).order("reported_at", {
        ascending: false
      }).limit(10);

      // Fetch biomarker scores
      const {
        data: biomarkers
      } = await supabase.from("biomarker_scores").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      }).limit(5);

      // Fetch test orders
      const {
        data: orders
      } = await supabase.from("user_test_orders").select("*").eq("user_id", user.id).order("created_at", {
        ascending: false
      });

      // Fetch latest AI feedback
      const {
        data: feedback
      } = await supabase.from("ai_feedback_unified").select("*").eq("user_id", user.id).order("generated_at", {
        ascending: false
      }).limit(1).maybeSingle();

      // Fetch recent vitals
      const {
        data: vitalData
      } = await supabase.from("vitals_stream").select("*").eq("user_id", user.id).order("recorded_at", {
        ascending: false
      }).limit(5);

      // Fetch supplements
      const {
        data: supplementData
      } = await supabase.from("supplements").select("*").eq("user_id", user.id).is("deleted_at", null);

      // Fetch active health issues
      const {
        data: issuesData
      } = await supabase.from("health_issues").select("*").eq("user_id", user.id).is("resolved_at", null);

      // Fetch user profile for age calculation
      const {
        data: profile
      } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle();

      // Fetch doctor reviews for reviewer info
      const {
        data: reviews
      } = await supabase.from("doctor_reviews").select("*, doctors(name)").eq("user_id", user.id).order("generated_at", {
        ascending: false
      }).limit(1).maybeSingle();

      // Fetch specialties count
      const {
        count: specialties
      } = await supabase.from("doctors").select("*", {
        count: 'exact',
        head: true
      }).eq("active", true);

      // Fetch pending test orders count
      const {
        count: pendingTests
      } = await supabase.from("user_test_orders").select("*", {
        count: 'exact',
        head: true
      }).eq("user_id", user.id).eq("status", "ordered");

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
  const calculateBiologicalAgeDifference = (profile: any) => {
    if (!profile?.dob || !profile?.biological_age_estimate) return null;
    const birthDate = new Date(profile.dob);
    const today = new Date();
    const chronologicalAge = differenceInDays(today, birthDate) / 365.25;
    const biologicalAge = profile.biological_age_estimate;
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
    if (scores.length === 0) return {
      status: "No Data",
      color: "text-muted-foreground"
    };
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (avgScore >= 80) return {
      status: "Excellent",
      color: "text-green-600"
    };
    if (avgScore >= 70) return {
      status: "Within Range",
      color: "text-accent-teal"
    };
    if (avgScore >= 60) return {
      status: "Needs Attention",
      color: "text-yellow-600"
    };
    return {
      status: "Needs Improvement",
      color: "text-red-600"
    };
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

  // Get test category for a test
  const getTestCategory = (testCode: string, testName: string) => {
    const testKey = testName || testCode;
    if (['TSH', 'Free T3', 'Free T4', 'TPOAb'].some(t => testKey.includes(t))) return 'Thyroid Function';
    if (['ApoB:ApoA1 Ratio', 'Triglycerides:HDL', 'Apolipoprotein', 'HDL', 'LDL', 'Cholesterol', 'Triglycerides'].some(t => testKey.includes(t))) return 'Heart Health';
    if (['eGFR', 'Creatinine'].some(t => testKey.includes(t))) return 'Kidney Function';
    if (['ALT', 'AST'].some(t => testKey.includes(t))) return 'Liver Function';
    return 'General Health';
  };

  // Generate historical trend data for a test
  const getHistoricalTrend = (testCode: string, currentValue: number) => {
    const trends: Record<string, number> = {
      'Free T3': -3,
      'Free T4': +2,
      'TPOAb': -12,
      'TSH': +5,
      'ApoB:ApoA1 Ratio': -5,
      'Triglycerides:HDL': -8,
      'eGFR': +3,
      'Creatinine': -2,
      'ALT': +4
    };
    return trends[testCode] || 0;
  };

  // Get category tests with historical data
  const getCategoryTests = (category: string) => {
    const categoryTests = displayLabResults.filter((lab: any) => 
      getTestCategory(lab.test_code, lab.test_name) === category
    );

    return categoryTests.map((lab: any) => ({
      ...lab,
      trend: getHistoricalTrend(lab.test_code, parseFloat(lab.value_num))
    }));
  };

  // Get category status
  const getCategoryStatus = (category: string) => {
    const tests = getCategoryTests(category);
    const abnormalCount = tests.filter((test: any) => {
      if (!test.value_num || !test.reference_low || !test.reference_high) return false;
      const value = parseFloat(test.value_num);
      const low = parseFloat(test.reference_low);
      const high = parseFloat(test.reference_high);
      return value < low || value > high;
    }).length;

    if (abnormalCount === 0) return { message: `Your ${category} levels are in range.`, icon: CheckCircle2, color: 'text-green-500' };
    if (abnormalCount <= tests.length / 3) return { message: `Some ${category} markers need attention.`, icon: AlertCircle, color: 'text-orange-500' };
    return { message: `Multiple ${category} markers are out of range.`, icon: XCircle, color: 'text-red-500' };
  };

  // Mock data generators for when no real data exists
  const getMockLabResults = () => {
    const now = new Date();
    return [{
      test_code: "Free T3",
      test_name: "Free T3",
      value_num: "3.3",
      units: "pg/mL",
      reference_low: "2.0",
      reference_high: "4.4",
      reported_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "Free T4",
      test_name: "Free T4",
      value_num: "1.2",
      units: "ng/dL",
      reference_low: "0.8",
      reference_high: "1.8",
      reported_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "TPOAb",
      test_name: "TPOAb",
      value_num: "20",
      units: "IU/mL",
      reference_low: "0",
      reference_high: "34",
      reported_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "TSH",
      test_name: "TSH",
      value_num: "1.92",
      units: "uIU/mL",
      reference_low: "0.4",
      reference_high: "4.0",
      reported_at: new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 62 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "ApoB:ApoA1 Ratio",
      test_name: "ApoB:ApoA1 Ratio",
      value_num: "0.88",
      units: "",
      reference_low: "0",
      reference_high: "0.9",
      reported_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "Triglycerides:HDL",
      test_name: "Triglycerides:HDL",
      value_num: "1.08",
      units: "",
      reference_low: "0",
      reference_high: "2.0",
      reported_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 110 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "eGFR",
      test_name: "eGFR",
      value_num: "105",
      units: "mL/min/1.73 m2",
      reference_low: "90",
      reference_high: "120",
      reported_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "Creatinine",
      test_name: "Creatinine",
      value_num: "0.68",
      units: "mg/dL",
      reference_low: "0.7",
      reference_high: "1.3",
      reported_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 145 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      test_code: "ALT",
      test_name: "ALT",
      value_num: "37",
      units: "U/L",
      reference_low: "7",
      reference_high: "56",
      reported_at: new Date(now.getTime() - 189 * 24 * 60 * 60 * 1000).toISOString(),
      collected_at: new Date(now.getTime() - 189 * 24 * 60 * 60 * 1000).toISOString()
    }];
  };
  const getMockBiomarkerScores = () => ({
    cardio_resp: 78,
    metabolic_lipids: 72,
    inflammation_immunity: 85,
    hormones: 68
  });
  const getMockUserProfile = () => {
    const dob = "1990-05-15";
    const birthDate = new Date(dob);
    const chronologicalAge = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return {
      dob,
      biological_age_estimate: chronologicalAge - 8,
      // AI-analyzed: 8 years younger than chronological age
      first_name: "Demo",
      last_name: "User"
    };
  };

  // Determine if we're using mock data
  const usingMockData = labResults.length === 0 && biomarkerScores.length === 0;

  // Use real data or fallback to mock
  const displayLabResults = labResults.length > 0 ? labResults : getMockLabResults();
  const displayDomainScores = Object.keys(domainScores).length > 0 ? domainScores : getMockBiomarkerScores();
  const displayUserProfile = userProfile || getMockUserProfile();
  const displayReviewer = latestReviewer || "Dr. Sarah Johnson, MD";

  // Debug: Log the display data
  console.log('displayLabResults:', displayLabResults);
  console.log('displayLabResults length:', displayLabResults.length);
  const quickChecks = [{
    title: "Feeling Anxious?",
    description: "Quick self-assessment",
    icon: AlertCircle,
    color: "#12AFCB"
  }, {
    title: "Body Discomfort?",
    description: "Log symptoms",
    icon: Activity,
    color: "#19D0E4"
  }];
  const tipCards = [{
    title: "Hydration Low Today",
    description: "You've had 1.2L. Goal is 2.5L.",
    icon: Droplet,
    action: "Log Water"
  }, {
    title: "Try 10-Min Meditation",
    description: "Your HRV suggests you could benefit from relaxation.",
    icon: Moon,
    action: "Start Session"
  }, {
    title: "Schedule Recovery Day",
    description: "You've trained 6 days straight. Consider active recovery.",
    icon: Heart,
    action: "View Plan"
  }];
  const labSummary = getLatestLabSummary();
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center animate-glow-pulse">
          <Activity className="w-6 h-6 text-accent-teal animate-spin" />
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* AI Analysis Summary */}
      {aiFeedback && <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 via-accent-teal-alt/5 to-transparent backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_8px_40px_rgba(18,175,203,0.15)]">
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
          {aiFeedback.summary_md && <div className="p-6 rounded-2xl bg-card/80 border border-border mb-6">
              <h4 className="font-rounded font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-teal" />
                Medical Summary
              </h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {aiFeedback.summary_md}
              </p>
            </div>}

          {/* AI Recommendations */}
          {aiFeedback.next_best_actions && <div className="p-6 rounded-2xl bg-card/80 border border-border">
              <h4 className="font-rounded font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-teal" />
                Recommended Actions
              </h4>
              <div className="space-y-3">
                {typeof aiFeedback.next_best_actions === 'string' ? JSON.parse(aiFeedback.next_best_actions).map((action: string, idx: number) => <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-accent-teal/5 to-transparent border border-accent-teal/10 hover:border-accent-teal/20 transition-all">
                        <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent-teal">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground flex-1">{action}</p>
                      </div>) : Array.isArray(aiFeedback.next_best_actions) ? aiFeedback.next_best_actions.map((action: any, idx: number) => <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-accent-teal/5 to-transparent border border-accent-teal/10 hover:border-accent-teal/20 transition-all">
                        <div className="w-6 h-6 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent-teal">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground flex-1">
                          {typeof action === 'string' ? action : action.title || action.action}
                        </p>
                      </div>) : null}
              </div>
            </div>}
        </div>}

      {/* My Results Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent backdrop-blur-xl border border-purple-500/20 p-8 shadow-[0_8px_40px_rgba(147,51,234,0.15)]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-rounded text-2xl font-bold text-foreground">
              My Results
            </h3>
            {usingMockData && <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-rounded font-semibold">
                Sample Data
              </span>}
          </div>
            <button onClick={() => navigate("/doctor-hub")} className="text-sm text-accent-teal hover:text-accent-teal-alt transition-colors flex items-center gap-1">
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline of Recent Tests */}
          <div className="mb-8">
            <h4 className="font-rounded font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-teal" />
              Test Timeline ({displayLabResults.length} tests)
            </h4>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {displayLabResults.slice(0, 6).map((lab: any, idx: number) => <button key={idx} className={`px-4 py-3 rounded-xl border transition-all ${idx === 0 ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' : 'bg-card/60 border-border text-muted-foreground hover:border-accent-teal/20'}`}>
                      <div className="flex flex-col gap-1 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          <span className="text-xs font-rounded font-semibold">
                            {lab.test_name || lab.test_code}
                          </span>
                        </div>
                        <span className="text-xs font-rounded font-medium opacity-80">
                          {format(new Date(lab.reported_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </button>)}
              </div>
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
                const ageData = calculateBiologicalAgeDifference(displayUserProfile);
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

            {displayLabResults[0]?.reported_at && <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/10">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-0.5">Result Date</div>
                  <div className="text-sm font-rounded font-bold text-foreground">
                    {format(new Date(displayLabResults[0].reported_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>}
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
                {Object.entries(displayDomainScores).map(([domain, score]: [string, any]) => <div key={domain} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent">
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
                  </div>)}
              </div>
            </div>

            {/* Biological Age Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🏅</div>
                <h4 className="font-rounded font-semibold text-foreground text-lg">
                  Biological Age
                </h4>
              </div>
              
              <div className="flex-1 flex flex-col justify-center text-center py-6">
                <div className="text-6xl font-rounded font-bold text-foreground mb-4">
                  {(() => {
                const ageData = calculateBiologicalAgeDifference(displayUserProfile);
                if (ageData) return ageData.biologicalAge;
                if (displayUserProfile.biological_age_estimate) {
                  return Math.floor(displayUserProfile.biological_age_estimate);
                }
                // Fallback to chronological age if no biological age estimate
                const birthDate = new Date(displayUserProfile.dob);
                return Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              })()}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Your biological age is{' '}
                  <span className="font-semibold text-foreground">
                    {(() => {
                  const ageData = calculateBiologicalAgeDifference(displayUserProfile);
                  if (ageData) return Math.abs(ageData.difference);
                  const birthDate = new Date(displayUserProfile.dob);
                  const chronologicalAge = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                  return Math.abs(parseFloat((chronologicalAge - displayUserProfile.biological_age_estimate).toFixed(1)));
                })()} years{' '}
                    {(() => {
                  const ageData = calculateBiologicalAgeDifference(displayUserProfile);
                  if (ageData) return ageData.isYounger ? 'younger' : 'older';
                  const birthDate = new Date(displayUserProfile.dob);
                  const chronologicalAge = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                  return chronologicalAge > displayUserProfile.biological_age_estimate ? 'younger' : 'older';
                })()}
                  </span>
                  {' '}than your chronological age
                </p>
              </div>

              <button className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-foreground font-rounded font-medium hover:shadow-[0_4px_20px_rgba(234,179,8,0.3)] transition-all text-sm mt-6">
                SHARE
              </button>
            </div>
          </div>
        </div>

      {/* Medical Overview Card */}
      {labSummary ? <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
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

          <div className="space-y-3">
            {labSummary.labs.slice(0, 9).map((lab: any, idx: number) => {
          // Map test codes to descriptions
          const testDescriptions: Record<string, string> = {
            'TSH': 'Metabolism regulator',
            'Free T3': 'Active thyroid hormone',
            'Free T4': 'Active thyroid hormone',
            'TPOAb': 'Thyroid autoimmunity indicator',
            'CBC': 'Complete blood health',
            'CMP': 'Metabolic panel',
            'LIPID': 'Cardiovascular risk indicator',
            'HBA1C': 'Blood sugar control',
            'VITD': 'Bone and immune health vitamin',
            'ApoB:ApoA1 Ratio': 'Cardiovascular risk indicator',
            'Triglycerides:HDL': 'Insulin resistance indicator',
            'eGFR': 'Kidney function indicator',
            'Creatinine': 'Kidney function indicator',
            'ALT': 'Indicator of liver health'
          };

          // Determine status color based on reference ranges
          const getStatusColor = () => {
            if (!lab.value_num || !lab.reference_low || !lab.reference_high) return 'bg-blue-500';
            const value = parseFloat(lab.value_num);
            const low = parseFloat(lab.reference_low);
            const high = parseFloat(lab.reference_high);
            if (value < low * 0.9 || value > high * 1.1) return 'bg-red-500';
            if (value < low || value > high) return 'bg-orange-500';
            return 'bg-green-500';
          };

          const getStatusIcon = () => {
            if (!lab.value_num || !lab.reference_low || !lab.reference_high) return CheckCircle2;
            const value = parseFloat(lab.value_num);
            const low = parseFloat(lab.reference_low);
            const high = parseFloat(lab.reference_high);
            if (value < low * 0.9 || value > high * 1.1) return XCircle;
            if (value < low || value > high) return AlertCircle;
            return CheckCircle2;
          };

          const description = testDescriptions[lab.test_code] || testDescriptions[lab.test_name] || 'Health indicator';
          const category = getTestCategory(lab.test_code, lab.test_name);
          const isExpanded = expandedTestCategory === category;

          return <Collapsible key={idx} open={isExpanded} onOpenChange={() => setExpandedTestCategory(isExpanded ? null : category)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border hover:border-accent-teal/20 transition-all py-[16px] my-[15px] cursor-pointer group">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="font-rounded font-semibold text-foreground">
                            {lab.test_name || lab.test_code}
                          </div>
                          <div className="w-5 h-5 rounded-full bg-accent-teal/10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                            <Info className="w-3 h-3 text-accent-teal" />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {description}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-lg font-rounded font-bold text-foreground">
                            {lab.value_num || lab.value_text}
                          </span>
                          {lab.units && <span className="text-sm text-muted-foreground ml-1">{lab.units}</span>}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-accent-teal/20 shadow-lg">
                      {/* Category Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-accent-teal" />
                          </div>
                          <div>
                            <h4 className="font-rounded font-bold text-xl text-foreground">{category}</h4>
                            <div className={`flex items-center gap-2 mt-1 ${getCategoryStatus(category).color}`}>
                              {(() => {
                                const StatusIcon = getCategoryStatus(category).icon;
                                return <StatusIcon className="w-4 h-4" />;
                              })()}
                              <span className="text-sm font-medium">{getCategoryStatus(category).message}</span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal font-rounded font-medium text-sm transition-colors">
                          View History
                        </button>
                      </div>

                      {/* Category Tests */}
                      <div className="space-y-3">
                        {getCategoryTests(category).map((test: any, testIdx: number) => {
                          const StatusIcon = getStatusIcon();
                          const statusColor = getStatusColor();
                          const trendValue = test.trend;
                          const isPositiveTrend = trendValue > 0;
                          
                          return (
                            <div key={testIdx} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  statusColor === 'bg-green-500' ? 'bg-green-500/10' :
                                  statusColor === 'bg-orange-500' ? 'bg-orange-500/10' :
                                  statusColor === 'bg-red-500' ? 'bg-red-500/10' : 'bg-blue-500/10'
                                }`}>
                                  <StatusIcon className={`w-4 h-4 ${
                                    statusColor === 'bg-green-500' ? 'text-green-500' :
                                    statusColor === 'bg-orange-500' ? 'text-orange-500' :
                                    statusColor === 'bg-red-500' ? 'text-red-500' : 'text-blue-500'
                                  }`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-rounded font-semibold text-foreground">
                                    {test.test_name || test.test_code}
                                  </div>
                                  {test.reference_low && test.reference_high && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Reference: {test.reference_low} - {test.reference_high} {test.units}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-rounded font-bold text-foreground">
                                    {test.value_num} <span className="text-sm text-muted-foreground">{test.units}</span>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-1 ${isPositiveTrend ? 'text-green-500' : 'text-red-500'}`}>
                                  {isPositiveTrend ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                  <span className="text-sm font-rounded font-semibold">{Math.abs(trendValue)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Explanation */}
                      <div className="mt-6 p-4 rounded-xl bg-accent-teal/5 border border-accent-teal/10">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-rounded font-semibold text-foreground mb-2">About {category}</h5>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {category === 'Heart Health' && 'These biomarkers assess cardiovascular risk and lipid metabolism. Maintaining optimal ratios is crucial for long-term heart health.'}
                              {category === 'Thyroid Function' && 'Thyroid hormones regulate metabolism, energy levels, and body temperature. These tests help identify potential thyroid disorders.'}
                              {category === 'Kidney Function' && 'Kidney markers evaluate how well your kidneys filter waste and maintain fluid balance. Regular monitoring is important for overall health.'}
                              {category === 'Liver Function' && 'Liver enzymes indicate liver health and help detect potential liver damage or disease. The liver plays a vital role in metabolism and detoxification.'}
                              {category === 'General Health' && 'These general health markers provide insights into your overall wellness and help identify potential health concerns.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>;
        })}
          </div>

          {biomarkerScores.length > 0 && <div className="p-6 rounded-2xl bg-card/80 border border-border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-accent-teal" />
                <h4 className="font-rounded font-semibold text-foreground">Health Scores</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {biomarkerScores.slice(0, 4).map((score: any, idx: number) => <div key={idx} className="text-center">
                    <div className="text-3xl font-rounded font-bold text-accent-teal mb-1">
                      {score.score}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {score.domain}
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* DoctorHub Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Available Specialties */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {specialtiesCount}
              </div>
              <div className="text-xs text-muted-foreground">Available<br />Specialties</div>
            </div>

            {/* Pending Test Orders */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {testOrdersCount}
              </div>
              <div className="text-xs text-muted-foreground">Pending<br />Test Orders</div>
            </div>

            {/* Unread Messages */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {unreadMessagesCount}
              </div>
              <div className="text-xs text-muted-foreground">Unread<br />Messages</div>
            </div>

            {/* Active Health Issues */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border text-center">
              <div className="text-2xl font-rounded font-bold text-accent-teal mb-1">
                {healthIssues.length}
              </div>
              <div className="text-xs text-muted-foreground">Active<br />Health Issues</div>
            </div>
          </div>

          <button onClick={() => navigate("/doctor-hub")} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-semibold shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Stethoscope className="w-5 h-5" />
            DoctorHub
          </button>
        </div> : <div className="rounded-3xl bg-gradient-to-br from-accent-teal/10 to-accent-teal-alt/5 backdrop-blur-xl border border-accent-teal/20 p-8 text-center">
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
            <button onClick={() => setUploadModalOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-medium hover:shadow-[0_4px_20px_rgba(18,175,203,0.3)] transition-shadow">
              Upload File
            </button>
            <button onClick={() => {
          toast({
            title: "Coming Soon",
            description: "EHR integration will be available soon. Use 'Upload File' for now."
          });
        }} className="px-6 py-3 rounded-xl bg-card border border-accent-teal/20 text-accent-teal font-rounded font-medium hover:bg-accent-teal/5 transition-colors">
              Connect EHR
            </button>
          </div>
        </div>}

      {/* Test Reminders */}
      {testReminders.length > 0 && <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-teal-alt/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent-teal" />
            </div>
            <h3 className="font-rounded text-xl font-semibold text-foreground">Test Reminders</h3>
          </div>
          <div className="space-y-3">
            {testReminders.slice(0, 5).map((reminder: any, idx: number) => <div key={idx} className="p-4 rounded-2xl bg-card border border-border hover:border-accent-teal/20 transition-all">
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
                        {reminder.type === 'pending_order' ? `Status: ${reminder.status}` : reminder.dueInDays > 0 ? `Due in ${reminder.dueInDays} days` : `Overdue by ${Math.abs(reminder.dueInDays)} days`}
                      </p>
                    </div>
                  </div>
                  {reminder.type === 'recheck_due' && reminder.dueInDays <= 30 && <div className="px-3 py-1 rounded-lg bg-accent-teal/10 text-accent-teal text-xs font-rounded font-semibold">
                      {reminder.dueInDays <= 0 ? 'Overdue' : 'Soon'}
                    </div>}
                </div>
              </div>)}
          </div>
        </div>}

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
            <button onClick={() => setChatOpen(true)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-teal to-accent-teal-alt text-white font-rounded font-semibold shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
              Start Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Quick Self-Checks */}
      <div className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-foreground">Quick Check-Ins</h3>
          <button onClick={() => setIssueModalOpen(true)} className="w-8 h-8 rounded-xl bg-accent-teal/10 hover:bg-accent-teal/20 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 text-accent-teal" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {quickChecks.map(check => <button key={check.title} onClick={() => {
          setIssueModalOpen(true);
        }} className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border hover:border-accent-teal/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all text-left group">
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
            </button>)}
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
          {tipCards.map((tip, idx) => <div key={idx} className="p-6 rounded-2xl bg-card/80 border border-border hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all">
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
            </div>)}
        </div>
      </div>

      <IssueModal open={issueModalOpen} onOpenChange={setIssueModalOpen} onSuccess={loadHealthData} />
      <FileUploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} onSuccess={loadHealthData} />
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} initialMessage="Review my latest health data and tell me what I should improve next." />
    </div>;
}