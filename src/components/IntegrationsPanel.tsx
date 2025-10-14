import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { syncDeviceData } from "@/utils/healthIntegrations";
import type { Database } from "@/integrations/supabase/types";

type DataSource = Database["public"]["Enums"]["data_source"];

interface Integration {
  id: DataSource;
  name: string;
  description: string;
  status: 'connected' | 'available' | 'native_only';
  category: 'wearable' | 'cgm' | 'scale' | 'health_record';
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'apple_health',
    name: 'Apple Health (HealthKit)',
    description: 'HR, HRV, RHR, SpO₂, respiratory rate, workouts, sleep, body composition, VO₂max, BP, glucose',
    status: 'native_only',
    category: 'health_record',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    description: 'Fitness tracking, heart rate, sleep, stress, body battery',
    status: 'available',
    category: 'wearable',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Activity, heart rate, sleep, weight',
    status: 'available',
    category: 'wearable',
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    description: 'Sleep, readiness, activity, heart rate variability',
    status: 'available',
    category: 'wearable',
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    description: 'Strain, recovery, sleep, heart rate variability',
    status: 'available',
    category: 'wearable',
  },
  {
    id: 'dexcom',
    name: 'Dexcom',
    description: 'Continuous glucose monitoring',
    status: 'available',
    category: 'cgm',
  },
  {
    id: 'withings',
    name: 'Withings',
    description: 'Weight, body composition, blood pressure',
    status: 'available',
    category: 'scale',
  },
  {
    id: 'fhir',
    name: 'FHIR Health Records',
    description: 'Import standardized health records from healthcare providers',
    status: 'available',
    category: 'health_record',
  },
];

export default function IntegrationsPanel() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleConnect = async (integration: Integration) => {
    if (integration.status === 'native_only') {
      toast({
        title: "Native Integration",
        description: "This integration requires a native mobile app. Convert this app to use Capacitor to enable HealthKit integration.",
      });
      return;
    }

    setSyncing(integration.id);
    try {
      if (integration.id === 'fhir') {
        toast({
          title: "FHIR Import",
          description: "Please upload your FHIR bundle JSON file to import health records.",
        });
      } else {
        await syncDeviceData(integration.id);
        toast({
          title: "Sync Complete",
          description: `Successfully synced data from ${integration.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const groupedIntegrations = INTEGRATIONS.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  const categoryNames: Record<string, string> = {
    wearable: 'Wearables & Fitness Trackers',
    cgm: 'Continuous Glucose Monitors',
    scale: 'Smart Scales',
    health_record: 'Health Records',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Health Data Integrations</h2>
        <p className="text-muted-foreground">
          Connect your devices and health records to get comprehensive health insights
        </p>
      </div>

      {Object.entries(groupedIntegrations).map(([category, integrations]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-3">{categoryNames[category]}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {integration.description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        integration.status === 'connected'
                          ? 'default'
                          : integration.status === 'native_only'
                          ? 'outline'
                          : 'secondary'
                      }
                    >
                      {integration.status === 'connected'
                        ? 'Connected'
                        : integration.status === 'native_only'
                        ? 'Native Only'
                        : 'Available'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleConnect(integration)}
                    disabled={syncing === integration.id}
                    variant={integration.status === 'connected' ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {syncing === integration.id
                      ? 'Syncing...'
                      : integration.status === 'connected'
                      ? 'Sync Now'
                      : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Location & Venues</CardTitle>
          <CardDescription>
            Find nearby healthy restaurants, cafes, and groceries with nutrition information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Uses Apple Maps/Places to search for venues near you. Menu nutrition data is stored locally for quick access.
          </p>
          <Button variant="outline" className="w-full">
            Search Nearby Venues
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
