import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DataSource = Database["public"]["Enums"]["data_source"];
type VitalMetric = Database["public"]["Enums"]["vital_metric"];

export interface HealthDataPoint {
  metric: VitalMetric;
  value: number;
  units: string;
  recorded_at: string;
  source: DataSource;
}

export interface WorkoutData {
  type: string;
  duration_minutes: number;
  calories: number;
  recorded_at: string;
  source: DataSource;
}

export interface SleepData {
  duration_minutes: number;
  deep_sleep_minutes?: number;
  rem_sleep_minutes?: number;
  recorded_at: string;
  source: DataSource;
}

// HealthKit Integration (iOS Native - requires Capacitor)
export class HealthKitProvider {
  static async requestAuthorization(): Promise<boolean> {
    // Placeholder - requires Capacitor HealthKit plugin
    console.log('HealthKit: Authorization requested');
    return false;
  }

  static async readVitals(): Promise<HealthDataPoint[]> {
    // Placeholder - would use Capacitor HealthKit plugin
    console.log('HealthKit: Reading vitals...');
    return [];
  }

  static async readWorkouts(): Promise<WorkoutData[]> {
    console.log('HealthKit: Reading workouts...');
    return [];
  }

  static async readSleep(): Promise<SleepData[]> {
    console.log('HealthKit: Reading sleep data...');
    return [];
  }

  static async writeMindfulness(duration: number, date: Date): Promise<boolean> {
    console.log('HealthKit: Writing mindfulness session...', { duration, date });
    return false;
  }
}

// FHIR Import
export class FHIRProvider {
  static async importHealthRecords(fhirBundle: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Parse FHIR bundle and extract resources
    const resources = fhirBundle.entry?.map((entry: any) => entry.resource) || [];

    for (const resource of resources) {
      await supabase.from('ehr_records').insert({
        user_id: user.id,
        fhir_resource_type: resource.resourceType,
        fhir_id: resource.id,
        raw_json: resource,
      });
    }

    console.log('FHIR: Imported health records');
  }

  static async exportHealthRecords(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data } = await supabase
      .from('ehr_records')
      .select('*')
      .eq('user_id', user.id);

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: data?.map(record => ({
        resource: record.raw_json
      })) || []
    };
  }
}

// Device Providers (Mock implementations)
export class GarminProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('Garmin: Syncing data...');
    // Mock implementation - would call Garmin API
    return this.getMockData('garmin');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'hr',
        value: 72,
        units: 'bpm',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'hrv_rmssd',
        value: 45,
        units: 'ms',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

export class FitbitProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('Fitbit: Syncing data...');
    return this.getMockData('fitbit');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'steps',
        value: 8500,
        units: 'steps',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'rhr',
        value: 58,
        units: 'bpm',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

export class OuraProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('Oura: Syncing data...');
    return this.getMockData('oura');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'sleep_duration',
        value: 450,
        units: 'minutes',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'hrv_rmssd',
        value: 52,
        units: 'ms',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

export class WHOOPProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('WHOOP: Syncing data...');
    return this.getMockData('whoop');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'hrv_rmssd',
        value: 48,
        units: 'ms',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'resp_rate',
        value: 14,
        units: 'breaths/min',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

export class DexcomProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('Dexcom: Syncing glucose data...');
    return this.getMockData('dexcom');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'glucose',
        value: 95,
        units: 'mg/dL',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

export class WithingsProvider {
  static async sync(): Promise<HealthDataPoint[]> {
    console.log('Withings: Syncing data...');
    return this.getMockData('withings');
  }

  private static getMockData(source: DataSource): HealthDataPoint[] {
    const now = new Date();
    return [
      {
        metric: 'weight',
        value: 75,
        units: 'kg',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'bp_sys',
        value: 120,
        units: 'mmHg',
        recorded_at: now.toISOString(),
        source,
      },
      {
        metric: 'bp_dia',
        value: 80,
        units: 'mmHg',
        recorded_at: now.toISOString(),
        source,
      },
    ];
  }
}

// Unified sync function
export async function syncDeviceData(source: DataSource): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let dataPoints: HealthDataPoint[] = [];

  switch (source) {
    case 'garmin':
      dataPoints = await GarminProvider.sync();
      break;
    case 'fitbit':
      dataPoints = await FitbitProvider.sync();
      break;
    case 'oura':
      dataPoints = await OuraProvider.sync();
      break;
    case 'whoop':
      dataPoints = await WHOOPProvider.sync();
      break;
    case 'dexcom':
      dataPoints = await DexcomProvider.sync();
      break;
    case 'withings':
      dataPoints = await WithingsProvider.sync();
      break;
    default:
      throw new Error(`Unsupported data source: ${source}`);
  }

  // Insert data points into vitals_stream
  for (const point of dataPoints) {
    await supabase.from('vitals_stream').insert({
      user_id: user.id,
      metric: point.metric,
      value: point.value,
      units: point.units,
      recorded_at: point.recorded_at,
      source: point.source,
    });
  }

  console.log(`Synced ${dataPoints.length} data points from ${source}`);
}
