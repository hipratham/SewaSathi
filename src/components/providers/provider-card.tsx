
import Link from "next/link";
import Image from "next/image";
import type { ServiceProvider, ServiceProviderAvailability, ServiceProviderRates } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ServiceCategoryIcon from "@/components/icons/service-category-icon";
import { Star, MapPin, Clock, Tag, Send } from "lucide-react"; // Added Send icon

interface ProviderCardProps {
  provider: ServiceProvider;
}

const formatAvailabilityForCard = (availability?: ServiceProviderAvailability): string => {
  if (!availability) return "Not specified";
  let parts: string[] = [];
  if (availability.days && availability.days.length > 0) {
    if (availability.days.length === 7) parts.push("Everyday");
    else if (availability.days.length === 5 && availability.days.includes("Mon") && availability.days.includes("Fri")) parts.push("Weekdays");
    else parts.push(availability.days.join(', '));
  }
  if (availability.startTime && availability.endTime) parts.push(`${availability.startTime} - ${availability.endTime}`);
  else if (availability.startTime) parts.push(`from ${availability.startTime}`);
  else if (availability.endTime) parts.push(`until ${availability.endTime}`);
  
  const mainAvailability = parts.length > 0 ? parts.join(' ') : "Check profile";
  if (availability.notes) return `${mainAvailability} (${availability.notes.substring(0,30)}${availability.notes.length > 30 ? '...' : ''})`;
  return mainAvailability;
};

const formatRatesForCard = (rates: ServiceProviderRates): string => {
  const { type, amount, minAmount, maxAmount, details } = rates;
  let rateString = "";

  switch (type) {
    case "per-hour":
      rateString = amount ? `Rs. ${amount}/hour` : "Hourly (see details)";
      break;
    case "per-job":
      rateString = amount ? `Approx. Rs. ${amount}/job` : "Per job (see details)";
      break;
    case "fixed-project":
      rateString = amount ? `Rs. ${amount} (fixed)` : "Fixed price (see details)";
      break;
    case "varies":
      if (minAmount && maxAmount) rateString = `Rs. ${minAmount} - Rs. ${maxAmount}`;
      else rateString = "Rates vary";
      break;
    case "free-consultation":
      rateString = "Free Consultation";
      break;
    default:
      rateString = "Check profile for rates";
  }
  
  if (details && (type === "varies" || type === "free-consultation") && !(minAmount && maxAmount && type === "varies")) {
    rateString += `: ${details.substring(0, 20)}${details.length > 20 ? '...' : ''}`;
  } else if (details && amount) { 
     rateString += ` (${details.substring(0, 15)}${details.length > 15 ? '...' : ''})`;
  }
  return rateString;
};

export default function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start gap-4">
          {provider.profileImage ? (
             <Image
              src={provider.profileImage}
              alt={provider.name}
              width={80}
              height={80}
              className="rounded-lg border object-cover aspect-square"
              data-ai-hint="profile person"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-2xl font-bold">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <Link href={`/providers/${provider.id}`} passHref>
                <CardTitle className="text-xl mb-1 text-primary hover:underline cursor-pointer">{provider.name}</CardTitle>
            </Link>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <ServiceCategoryIcon category={provider.category} className="w-4 h-4 mr-1.5" />
              <span>{provider.category.charAt(0).toUpperCase() + provider.category.slice(1).replace('-', ' ')}</span>
              {provider.category === 'other' && provider.otherCategoryDescription && (
                <span className="ml-1 text-xs opacity-80">({provider.otherCategoryDescription.substring(0,20)}{provider.otherCategoryDescription.length > 20 ? '...' : ''})</span>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>{provider.address}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-2">
        {provider.servicesOffered && provider.servicesOffered.length > 0 && (
          <CardDescription className="line-clamp-2 text-sm">
            Services: {provider.servicesOffered.join(", ")}
          </CardDescription>
        )}
         {provider.servicesOffered.length === 0 && provider.category !== "other" && (
            <CardDescription className="text-sm">
             Primary service: {provider.category.charAt(0).toUpperCase() + provider.category.slice(1).replace('-', ' ')}
            </CardDescription>
        )}
         {provider.servicesOffered.length === 0 && provider.category === "other" && provider.otherCategoryDescription && (
            <CardDescription className="text-sm">
             Offers: {provider.otherCategoryDescription.substring(0,50)}{provider.otherCategoryDescription.length > 50 ? '...' : ''}
            </CardDescription>
        )}


        <div className="flex items-center gap-1 text-sm font-medium">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span>{provider.overallRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({provider.reviews.length} reviews)</span>
        </div>
        <div className="mt-2 flex items-center text-sm text-foreground/80">
           <Tag className="w-4 h-4 mr-1.5 text-muted-foreground" /> 
           <span>{formatRatesForCard(provider.rates)}</span>
        </div>
         {provider.availability && (
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1.5" />
            <span>{formatAvailabilityForCard(provider.availability)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild className="w-full">
          <Link href={`/request-service?providerId=${provider.id}`}>
            <Send className="mr-2 h-4 w-4" /> Request Service
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
