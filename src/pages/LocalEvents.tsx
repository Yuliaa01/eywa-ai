import { ArrowLeft, MapPin, Calendar, Clock, Cloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LocalEvents() {
  const navigate = useNavigate();

  const allEvents = [
    {
      title: "Community Running Group",
      location: "Central Park",
      time: "Tomorrow 6:30 AM",
      distance: "0.8 mi",
      weather: "Clear, 65°F",
      category: "Running",
      participants: 12,
    },
    {
      title: "Outdoor Yoga Class",
      location: "Riverside Park",
      time: "Today 7:00 PM",
      distance: "1.2 mi",
      weather: "Sunny, 72°F",
      category: "Yoga",
      participants: 8,
    },
    {
      title: "Cycling Club Meetup",
      location: "Brooklyn Bridge",
      time: "Saturday 8:00 AM",
      distance: "2.3 mi",
      weather: "Partly Cloudy, 68°F",
      category: "Cycling",
      participants: 15,
    },
    {
      title: "Bootcamp Training",
      location: "Prospect Park",
      time: "Friday 6:00 AM",
      distance: "1.8 mi",
      weather: "Clear, 62°F",
      category: "Strength",
      participants: 20,
    },
    {
      title: "Morning Walk & Talk",
      location: "High Line Park",
      time: "Tomorrow 7:00 AM",
      distance: "0.5 mi",
      weather: "Sunny, 66°F",
      category: "Walking",
      participants: 6,
    },
    {
      title: "HIIT Training Session",
      location: "Chelsea Piers",
      time: "Today 5:30 PM",
      distance: "2.1 mi",
      weather: "Clear, 70°F",
      category: "HIIT",
      participants: 10,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent-teal/5 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="font-rounded text-4xl font-bold text-foreground mb-2">
            Local Events
          </h1>
          <p className="text-muted-foreground">
            Discover fitness activities and community events near you
          </p>
        </div>

        {/* Events Grid */}
        <div className="space-y-4">
          {allEvents.map((event, index) => (
            <div
              key={index}
              className="rounded-3xl bg-card/60 backdrop-blur-xl border border-border p-6 hover:border-accent-teal/20 hover:shadow-[0_4px_20px_rgba(18,175,203,0.12)] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-xs font-rounded font-medium">
                      {event.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {event.participants} participants
                    </span>
                  </div>
                  <h3 className="font-rounded text-xl font-semibold text-foreground mb-3">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-accent-teal" />
                      <span>{event.location}</span>
                      <span className="text-accent-teal">• {event.distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-accent-teal" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Cloud className="w-4 h-4 text-accent-teal" />
                      <span className="text-accent-teal">{event.weather}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  className="bg-gradient-to-r from-accent-teal to-accent-teal-alt hover:opacity-90"
                >
                  Join Event
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
