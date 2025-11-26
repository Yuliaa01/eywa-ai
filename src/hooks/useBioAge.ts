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
    let mounted = true;

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) {
          setData(prev => ({ ...prev, loading: false }));
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('dob, biological_age_estimate')
          .eq('user_id', user.id)
          .single();

        if (!profile?.dob || !mounted) {
          setData(prev => ({ ...prev, loading: false }));
          return;
        }

        // Calculate chronological age from DOB
        const birthDate = new Date(profile.dob);
        const today = new Date();
        const chronologicalAge = Math.floor(differenceInDays(today, birthDate) / 365.25);

        // Get biological age if available
        const biologicalAge = profile.biological_age_estimate 
          ? Math.round(profile.biological_age_estimate) 
          : null;

        // Calculate difference only if biological age exists
        let difference = null;
        let isYounger = false;
        if (biologicalAge !== null) {
          difference = chronologicalAge - biologicalAge;
          isYounger = difference > 0;
        }

        if (mounted) {
          setData({
            chronologicalAge,
            biologicalAge,
            difference: difference !== null ? parseFloat(difference.toFixed(1)) : null,
            isYounger,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error loading bio-age data:', error);
        if (mounted) {
          setData(prev => ({ ...prev, loading: false }));
        }
      }
    };

    loadData();

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
          if (mounted) loadData();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}
