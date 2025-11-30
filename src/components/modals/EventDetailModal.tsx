import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Star, DollarSign, User, Calendar, Phone, Mail } from "lucide-react";
import { ActionButton } from "@/components/glass/ActionButton";

interface EventDetail {
  name: string;
  type: string;
  distance: string;
  rating: number;
  priceLevel: string;
  cuisine: string[];
  address: string;
  match: string;
  hours: string;
  coords: { lat: number; lng: number };
  description?: string;
  instructor?: {
    name: string;
    bio: string;
    certifications: string[];
  };
  bookingInfo?: {
    capacity: number;
    spotsAvailable: number;
    phone: string;
    email: string;
  };
}

interface EventDetailModalProps {
  event: EventDetail | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailModal({ event, open, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const handleBookNow = () => {
    // Handle booking logic here
    console.log("Booking event:", event.name);
  };

  const handleContact = (method: 'phone' | 'email') => {
    if (method === 'phone' && event.bookingInfo?.phone) {
      window.location.href = `tel:${event.bookingInfo.phone}`;
    } else if (method === 'email' && event.bookingInfo?.email) {
      window.location.href = `mailto:${event.bookingInfo.email}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-rounded text-2xl">{event.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {event.type}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent-teal text-accent-teal" />
              <span className="text-sm font-medium">{event.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{event.priceLevel}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-sm font-medium">
              {event.match}
            </div>
          </div>

          {/* Location & Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent-teal mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{event.address}</p>
                <p className="text-sm text-accent-teal">{event.distance} away</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-accent-teal mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">{event.hours}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {event.description && (
            <>
              <div>
                <h3 className="font-semibold mb-2">About This Event</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {event.cuisine.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-accent-teal/5 border-accent-teal/20"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Instructor Info */}
          {event.instructor && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-accent-teal" />
                  <h3 className="font-semibold">Instructor</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{event.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">{event.instructor.bio}</p>
                  {event.instructor.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {event.instructor.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Booking Info */}
          {event.bookingInfo && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-accent-teal" />
                  <h3 className="font-semibold">Booking Information</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Capacity</span>
                    <span className="text-sm font-medium">{event.bookingInfo.capacity} people</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Spots Available</span>
                    <span className={`text-sm font-medium ${
                      event.bookingInfo.spotsAvailable < 5 ? 'text-destructive' : 'text-accent-teal'
                    }`}>
                      {event.bookingInfo.spotsAvailable} left
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact('phone')}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact('email')}
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <ActionButton
              variant="primary"
              className="flex-1"
              onClick={handleBookNow}
            >
              Book Now
            </ActionButton>
            <ActionButton
              variant="secondary"
              className="flex-1"
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.coords.lat},${event.coords.lng}`, '_blank');
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Directions
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
