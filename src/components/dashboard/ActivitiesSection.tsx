import { Activity, MapPin, Play, TrendingUp, Calendar, Zap, Clock } from "lucide-react";

export default function ActivitiesSection() {
  const todaysPlan = {
    title: "Today's Workout",
    type: "Upper Body Strength",
    duration: "45 min",
    calories: "320 kcal",
    thumbnail: "/placeholder.svg",
  };

  const motivationPulse = {
    energy: 85,
    streak: 12,
    weeklyGoal: 5,
    completed: 4,
  };

  const aiSuggestions = [
    {
      type: "Walk",
      duration: "30 min",
      time: "Morning",
      benefit: "Boost energy & focus",
    },
    {
      type: "Yoga",
      duration: "20 min",
      time: "Evening",
      benefit: "Recovery & flexibility",
    },
    {
      type: "Zone 2 Cardio",
      duration: "40 min",
      time: "Afternoon",
      benefit: "Build aerobic base",
    },
  ];

  const localEvents = [
    {
      title: "Community Running Group",
      location: "Central Park",
      time: "Tomorrow 6:30 AM",
      distance: "0.8 mi",
      weather: "Clear, 65°F",
    },
    {
      title: "Outdoor Yoga Class",
      location: "Riverside Park",
      time: "Today 7:00 PM",
      distance: "1.2 mi",
      weather: "Sunny, 72°F",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Workout */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12AFCB]/10 to-[#19D0E4]/5 backdrop-blur-xl border border-[#12AFCB]/20 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.1)]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-rounded text-2xl font-semibold text-[#0E1012] mb-2">
              {todaysPlan.title}
            </h3>
            <p className="text-[#5A6B7F]">{todaysPlan.type}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center animate-glow-pulse">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[#12AFCB]" />
              <span className="text-sm text-[#5A6B7F]">Duration</span>
            </div>
            <p className="font-rounded font-semibold text-[#0E1012]">{todaysPlan.duration}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/60 border border-[#12AFCB]/10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#12AFCB]" />
              <span className="text-sm text-[#5A6B7F]">Calories</span>
            </div>
            <p className="font-rounded font-semibold text-[#0E1012]">{todaysPlan.calories}</p>
          </div>
        </div>

        <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] text-white font-rounded font-semibold text-lg shadow-[0_4px_20px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
          <Play className="w-6 h-6" />
          Start Workout
        </button>
      </div>

      {/* Motivation Pulse */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <h3 className="font-rounded text-xl font-semibold text-[#0E1012] mb-6">
          Motivation Pulse
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.energy}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">Energy Level</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.streak}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">Day Streak</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#12AFCB]/20 to-[#19D0E4]/10 flex items-center justify-center">
              <span className="text-3xl font-bold bg-gradient-to-r from-[#12AFCB] to-[#19D0E4] bg-clip-text text-transparent">
                {motivationPulse.completed}/{motivationPulse.weeklyGoal}
              </span>
            </div>
            <p className="text-sm text-[#5A6B7F]">This Week</p>
          </div>
        </div>
      </div>

      {/* AI Movement Suggestions */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#12AFCB]" />
          </div>
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">AI Suggestions</h3>
        </div>
        <div className="space-y-3">
          {aiSuggestions.map((suggestion) => (
            <div
              key={suggestion.type}
              className="p-5 rounded-xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-1">
                    {suggestion.type}
                  </h4>
                  <p className="text-sm text-[#5A6B7F]">{suggestion.benefit}</p>
                </div>
                <Activity className="w-5 h-5 text-[#12AFCB]" />
              </div>
              <div className="flex items-center gap-4 text-sm text-[#5A6B7F]">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {suggestion.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {suggestion.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Events */}
      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-rounded text-xl font-semibold text-[#0E1012]">Local Events</h3>
          <button className="text-[#12AFCB] font-rounded font-medium text-sm hover:underline">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {localEvents.map((event) => (
            <div
              key={event.title}
              className="p-6 rounded-2xl bg-white/80 border border-[#12AFCB]/10 hover:border-[#12AFCB]/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-rounded font-semibold text-[#0E1012] mb-2">{event.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F] mb-1">
                    <MapPin className="w-4 h-4" />
                    {event.location} • {event.distance}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5A6B7F]">
                    <Calendar className="w-4 h-4" />
                    {event.time}
                  </div>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#12AFCB]/10 text-[#12AFCB] text-sm font-rounded inline-flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#12AFCB]" />
                {event.weather}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
