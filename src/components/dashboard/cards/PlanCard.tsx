import { MapPin, Calendar, Plane, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays, format, parseISO } from "date-fns";

interface PlanCardProps {
  id: string;
  title: string;
  description?: string | null;
  locationName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type: 'plan_trip' | 'plan_event';
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanCard({
  title,
  description,
  locationName,
  startDate,
  endDate,
  type,
  onEdit,
  onDelete,
}: PlanCardProps) {
  const isTrip = type === 'plan_trip';
  const startDateObj = startDate ? parseISO(startDate) : null;
  const endDateObj = endDate ? parseISO(endDate) : null;
  const daysUntil = startDateObj ? differenceInDays(startDateObj, new Date()) : null;
  
  const getCountdownText = () => {
    if (daysUntil === null) return null;
    if (daysUntil < 0) return 'In progress';
    if (daysUntil === 0) return 'Today!';
    if (daysUntil === 1) return 'Tomorrow';
    return `${daysUntil} days away`;
  };

  return (
    <div className="group p-4 bg-card rounded-xl border-2 border-accent/40 hover:border-accent/60 hover:shadow-md transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Date Badge */}
        <div className="flex-shrink-0">
          {startDateObj ? (
            <div className="w-14 h-14 rounded-xl bg-muted flex flex-col items-center justify-center text-foreground">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {format(startDateObj, 'MMM')}
              </span>
              <span className="text-xl font-bold leading-none">
                {format(startDateObj, 'd')}
              </span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
              {isTrip ? (
                <Plane className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Calendar className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground truncate">{title}</h4>
                {daysUntil !== null && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                    daysUntil <= 0
                      ? 'bg-accent/20 text-accent'
                      : daysUntil <= 7
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getCountdownText()}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Location & Date Info */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {locationName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="truncate max-w-[150px]">{locationName}</span>
              </div>
            )}
            {startDateObj && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                </div>
                <span>
                  {format(startDateObj, 'MMM d')}
                  {endDateObj && ` - ${format(endDateObj, 'MMM d')}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
