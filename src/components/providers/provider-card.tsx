
import Link from "next/link";
import Image from "next/image";
import type { ServiceProvider, ServiceProviderAvailability } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ServiceCategoryIcon from "@/components/icons/service-category-icon";
import { Star, MapPin, Clock } from "lucide-react";

interface ProviderCardProps {
  provider: ServiceProvider;
}

const formatAvailabilityForCard = (availability?: ServiceProviderAvailability): string => {
  if (!availability) return "Not specified";
  let parts: string[] = [];
  if (availability.days && availability.days.length > 0) {
    if (availability.days.length === 7) {
      parts.push("Everyday");
    } else if (availability.days.length === 5 && availability.days.includes("Mon") && availability.days.includes("Fri")) {
      parts.push("Weekdays");
    }
    else {
      parts.push(availability.days.join(', '));
    }
  }
  if (availability.startTime && availability.endTime) {
    parts.push(`${availability.startTime} - ${availability.endTime}`);
  }
  return parts.length > 0 ? parts.join(' ') : "Check profile for details";
};


export default function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start gap-4">
          {provider.profileImage && (
             <Image
              src={provider.profileImage}
              alt={provider.name}
              width={80}
              height={80}
              className="rounded-lg border object-cover aspect-square"
              data-ai-hint="profile person"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 text-primary">{provider.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <ServiceCategoryIcon category={provider.category} className="w-4 h-4 mr-1.5" />
              <span>{provider.category.charAt(0).toUpperCase() + provider.category.slice(1).replace('-', ' ')}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>{provider.address}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardDescription className="line-clamp-2 text-sm mb-3">
          {provider.servicesOffered.join(", ")}
        </CardDescription>
        <div className="flex items-center gap-1 text-sm font-medium">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span>{provider.overallRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({provider.reviews.length} reviews)</span>
        </div>
        <p className="mt-2 text-sm text-foreground/80">Rates: <span className="font-semibold">{provider.rates}</span></p>
         {provider.availability && (
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1.5" />
            <span>{formatAvailabilityForCard(provider.availability)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild className="w-full">
          <Link href={`/providers/${provider.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
