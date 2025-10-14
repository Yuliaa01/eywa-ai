import { useState } from "react";
import { Activity, Check, Loader2, Apple, Watch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncDeviceData } from "@/utils/healthIntegrations";
import type { Database } from "@/integrations/supabase/types";

type DataSource = Database["public"]["Enums"]["data_source"];

interface Connection {
  id: DataSource;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'idle' | 'connecting' | 'connected' | 'error';
}

interface ConnectionsStepProps {
  onNext: () => void;
  onDataIngested?: (data: any) => void;
}

export default function ConnectionsStep({ onNext, onDataIngested }: ConnectionsStepProps) {
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([
    { id: 'apple_health', name: 'Apple Health', icon: Apple, status: 'idle' },
    { id: 'fitbit', name: 'Fitbit', icon: Activity, status: 'idle' },
    { id: 'garmin', name: 'Garmin', icon: Watch, status: 'idle' },
    { id: 'oura', name: 'Oura Ring', icon: Activity, status: 'idle' },
    { id: 'whoop', name: 'WHOOP', icon: Activity, status: 'idle' },
    { id: 'dexcom', name: 'Dexcom CGM', icon: Activity, status: 'idle' },
    { id: 'withings', name: 'Withings', icon: Activity, status: 'idle' },
  ]);

  const handleConnect = async (connectionId: DataSource) => {
    setConnections(prev => prev.map(c => 
      c.id === connectionId ? { ...c, status: 'connecting' } : c
    ));

    try {
      if (connectionId === 'apple_health') {
        toast({
          title: "Native Integration",
          description: "Connect via iOS companion app for full HealthKit access.",
          duration: 3000,
        });
        setConnections(prev => prev.map(c => 
          c.id === connectionId ? { ...c, status: 'idle' } : c
        ));
        return;
      }

      await syncDeviceData(connectionId);
      
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, status: 'connected' } : c
      ));

      onDataIngested?.({ source: connectionId, timestamp: new Date() });

      toast({
        title: "Connected!",
        description: `Successfully connected to ${connections.find(c => c.id === connectionId)?.name}`,
        duration: 3000,
      });
    } catch (error) {
      setConnections(prev => prev.map(c => 
        c.id === connectionId ? { ...c, status: 'error' } : c
      ));
      toast({
        title: "Connection Failed",
        description: "Please try again or skip for now.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const hasAnyConnection = connections.some(c => c.status === 'connected');

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="text-center space-y-4">
        <h2 className="font-rounded text-[2rem] font-semibold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
          Connect Your Health Apps
        </h2>
        <p className="text-[1.0625rem] text-[#5A6B7F] max-w-md mx-auto leading-relaxed">
          Link your devices and clinics to import your health data automatically
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {connections.map((connection) => {
          const Icon = connection.icon;
          return (
            <button
              key={connection.id}
              onClick={() => handleConnect(connection.id)}
              disabled={connection.status === 'connecting' || connection.status === 'connected'}
              className="group relative rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-6 shadow-[0_4px_20px_rgba(18,175,203,0.06)] hover:bg-white/80 hover:border-[#12AFCB]/20 hover:shadow-[0_8px_32px_rgba(18,175,203,0.12)] transition-all duration-standard disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  connection.status === 'connected'
                    ? 'bg-gradient-to-br from-[#12AFCB] to-[#12AFCB]/80'
                    : connection.status === 'connecting'
                    ? 'bg-white/60 animate-glow-pulse'
                    : 'bg-white/60 group-hover:bg-[#12AFCB]/10'
                }`}>
                  {connection.status === 'connecting' ? (
                    <Loader2 className="w-7 h-7 text-[#12AFCB] animate-spin" />
                  ) : connection.status === 'connected' ? (
                    <Check className="w-7 h-7 text-white" />
                  ) : (
                    <Icon className="w-7 h-7 text-[#5A6B7F] group-hover:text-[#12AFCB] transition-colors" />
                  )}
                </div>
                <span className="text-[0.9375rem] font-rounded font-medium text-[#0E1012]">
                  {connection.name}
                </span>
                <span className={`text-[0.75rem] font-medium transition-colors ${
                  connection.status === 'connected' ? 'text-[#12AFCB]' :
                  connection.status === 'connecting' ? 'text-[#5A6B7F]' :
                  connection.status === 'error' ? 'text-red-500' :
                  'text-[#5A6B7F] group-hover:text-[#12AFCB]'
                }`}>
                  {connection.status === 'connected' ? 'Connected' :
                   connection.status === 'connecting' ? 'Connecting...' :
                   connection.status === 'error' ? 'Retry' :
                   'Connect'}
                </span>
              </div>
            </button>
          );
        })}

        <button className="group rounded-3xl bg-white/40 backdrop-blur-xl border border-dashed border-[#12AFCB]/20 p-6 hover:bg-white/60 hover:border-[#12AFCB]/30 transition-all duration-standard">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center">
              <Activity className="w-7 h-7 text-[#5A6B7F] group-hover:text-[#12AFCB] transition-colors" />
            </div>
            <span className="text-[0.9375rem] font-rounded font-medium text-[#5A6B7F] group-hover:text-[#0E1012] transition-colors">
              Upload File
            </span>
            <span className="text-[0.75rem] text-[#5A6B7F]">
              FHIR/CCDA
            </span>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <button
          onClick={onNext}
          disabled={!hasAnyConnection}
          className="w-full h-14 rounded-3xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white font-rounded font-semibold text-[1.0625rem] shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-glow-teal hover:scale-[1.02] active:scale-[0.98] transition-all duration-standard disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>

        <button
          onClick={onNext}
          className="w-full h-12 rounded-2xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 text-[#5A6B7F] font-rounded font-medium text-[1rem] hover:bg-white/80 hover:text-[#0E1012] hover:border-[#12AFCB]/20 transition-all duration-standard"
        >
          Skip - Add Data Later
        </button>
      </div>
    </div>
  );
}
