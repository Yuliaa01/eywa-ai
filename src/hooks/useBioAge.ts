import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface BioAgeData {
  chronologicalAge: number | null;
  biologicalAge: number | null;
  difference: number | null;
  isYounger: boolean;
  loading: boolean;
}

export function useBioAge(): BioAgeData {
  const [data, setData] = useState<BioAgeData>({
    chronologicalAge: null,
    biologicalAge: null,
    difference: null,
    isYounger: false,
    loading: true,
  });

  useEffect(() => {
    loadBioAgeData();

    // Subscribe to user_profiles changes for real-time updates
    const channel = supabase
      .channel('user_profiles_bioage')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        () => {
          loadBioAgeData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBioAgeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('dob, biological_age_estimate')
        .eq('user_id', user.id)
        .single();

      if (!profile?.dob || !profile?.biological_age_estimate) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      // Calculate chronological age
      const birthDate = new Date(profile.dob);
      const today = new Date();
      const chronologicalAge = Math.floor(differenceInDays(today, birthDate) / 365.25);

      // Get biological age
      const biologicalAge = Math.round(profile.biological_age_estimate);

      // Calculate difference
      const difference = chronologicalAge - biologicalAge;
      const isYounger = difference > 0;

      setData({
        chronologicalAge,
        biologicalAge,
        difference: parseFloat(difference.toFixed(1)),
        isYounger,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading bio-age data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  return data;
}
