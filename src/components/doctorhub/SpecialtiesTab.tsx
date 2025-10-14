import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import SpecialtyCard from "./SpecialtyCard";

interface Specialty {
  id: string;
  name: string;
  role_group: string;
  specialty: string;
  subspecialty: string | null;
  bio_short: string | null;
  focus_areas: string[] | null;
}

interface SpecialtiesTabProps {
  searchQuery: string;
}

const filterGroups = [
  { label: "All", value: "all" },
  { label: "Primary Care", value: "primary_care" },
  { label: "Specialists", value: "specialist" },
  { label: "Fitness", value: "fitness" },
  { label: "Longevity", value: "longevity" },
  { label: "Mental Health", value: "mental_health" },
];

export default function SpecialtiesTab({ searchQuery }: SpecialtiesTabProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    filterSpecialties();
  }, [activeFilter, searchQuery, specialties]);

  const loadSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setSpecialties(data || []);
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSpecialties = () => {
    let filtered = [...specialties];

    // Apply role group filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((s) => s.role_group === activeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.specialty.toLowerCase().includes(query) ||
          s.bio_short?.toLowerCase().includes(query)
      );
    }

    setFilteredSpecialties(filtered);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterGroups.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilter === filter.value ? "default" : "outline"}
            className={`cursor-pointer rounded-full px-4 py-2 transition-all ${
              activeFilter === filter.value
                ? "bg-[#12AFCB] text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
                : "bg-white/60 text-[#5A6B7F] hover:bg-white/80"
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>

      {/* Specialty Cards Grid */}
      {filteredSpecialties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpecialties.map((specialty) => (
            <SpecialtyCard key={specialty.id} specialty={specialty} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#5A6B7F]">No specialties found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
