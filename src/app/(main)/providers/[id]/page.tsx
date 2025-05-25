
"use client"; 

import { useParams } from "next/navigation";
import Image from "next/image";
import { mockServiceProviders } from "@/lib/mock-data";
import type { ServiceProvider, Review as ReviewType, ServiceProviderAvailability, ServiceProviderRates } from "@/lib/types";
import ServiceCategoryIcon from "@/components/icons/service-category-icon";
import ReviewCard from "@/components/reviews/review-card";
import ReviewSummary from "@/components/reviews/review-summary";
import ReviewForm from "@/components/reviews/review-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Mail, Clock, MessageSquarePlus, Tag, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formatAvailabilityForProfile = (availability?: ServiceProviderAvailability): string => {
  if (!availability) return "Not specified";
  let mainParts: string[] = [];
  if (availability.days && availability.days.length > 0) {
    mainParts.push(`Days: ${availability.days.join(', ')}`);
  }
  if (availability.startTime && availability.endTime) {
    mainParts.push(`Hours: ${availability.startTime} - ${availability.endTime}`);
  } else if (availability.startTime) {
    mainParts.push(`Starts: ${availability.startTime}`);
  } else if (availability.endTime) {
    mainParts.push(`Ends by: ${availability.endTime}`);
  }
  
  let fullString = mainParts.join(' | ') || "Availability not fully specified.";
  if (availability.notes) {
    fullString += (fullString.endsWith(".") ? ' ' : '. ') + `Notes: ${availability.notes}`;
  }
  return fullString;
};

const formatRatesForProfile = (rates: ServiceProviderRates): React.ReactNode => {
  const { type, amount, minAmount, maxAmount, details } = rates;
  let rateString = "";

  switch (type) {
    case "per-hour":
      rateString = amount ? `Rs. ${amount} per hour` : "Hourly rate (details not specified)";
      break;
    case "per-job":
      rateString = amount ? `Approx. Rs. ${amount} per job` : "Per job basis (details not specified)";
      break;
    case "fixed-project":
      rateString = amount ? `Rs. ${amount} (fixed project price)` : "Fixed project price (details not specified)";
      break;
    case "varies":
      if (minAmount && maxAmount) rateString = `Rs. ${minAmount} - Rs. ${maxAmount}`;
      else rateString = "Rates vary / Upon Consultation";
      break;
    case "free-consultation":
      rateString = "Offers Free Consultation";
      break;
    default:
      rateString = "Please contact for rate information.";
  }

  return (
    <>
      <p className="flex items-center"><Tag className="w-4 h-4 mr-2 text-muted-foreground" /> <span className="font-semibold">{rateString}</span></p>
      {details && (
        <Alert variant="default" className="mt-2 text-sm bg-secondary/30 border-secondary/50">
          <Info className="h-4 w-4 text-secondary-foreground/80" />
          <AlertTitle className="text-secondary-foreground font-medium">
            {type === "free-consultation" ? "Consultation Details" : "Rate Details"}
          </AlertTitle>
          <AlertDescription className="text-secondary-foreground/90">
            {details}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default function ProviderProfilePage() {
  const params = useParams();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);

  useEffect(() => {
    const foundProvider = mockServiceProviders.find((p) => p.id === providerId);
    if (foundProvider) {
      setProvider(foundProvider);
      setReviews(foundProvider.reviews);
    }
  }, [providerId]);

  const handleReviewSubmit = (newReviewData: { userName: string; rating: number; comment: string }) => {
    if (!provider) return;
    const newReview: ReviewType = {
      id: `review-${Date.now()}`, 
      userId: 'currentUser', 
      userName: newReviewData.userName,
      rating: newReviewData.rating,
      comment: newReviewData.comment,
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    
    const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
    const newOverallRating = updatedReviews.length > 0 ? parseFloat((totalRating / updatedReviews.length).toFixed(1)) : 0;
    
    setProvider(prev => prev ? {...prev, reviews: updatedReviews, overallRating: newOverallRating} : null);

    const providerIndex = mockServiceProviders.findIndex(p => p.id === providerId);
    if (providerIndex !== -1) {
      mockServiceProviders[providerIndex].reviews = updatedReviews;
      mockServiceProviders[providerIndex].overallRating = newOverallRating;
    }
  };

  if (!provider) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-xl text-muted-foreground">Provider not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-xl">
        <div className="relative h-48 md:h-64 w-full">
          <Image
            src={provider.profileImage || "https://placehold.co/1200x400.png"}
            alt={`${provider.name} cover image`}
            fill 
            style={{objectFit:"cover"}} 
            data-ai-hint="business cover photo"
            className="bg-muted"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{provider.name}</h1>
            <div className="flex items-center text-sm text-primary-foreground/80 mt-1">
              <ServiceCategoryIcon category={provider.category} className="w-5 h-5 mr-2" />
              <span>{provider.category.charAt(0).toUpperCase() + provider.category.slice(1).replace('-', ' ')}</span>
              {provider.category === 'other' && provider.otherCategoryDescription && (
                <span className="ml-2 text-xs opacity-80">({provider.otherCategoryDescription})</span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {provider.servicesOffered && provider.servicesOffered.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">Services Offered</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.servicesOffered.map((service) => (
                    <Badge key={service} variant="secondary" className="text-sm">{service}</Badge>
                  ))}
                </div>
              </section>
            )}
            {(!provider.servicesOffered || provider.servicesOffered.length === 0) && provider.category !== "other" && (
                 <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Primary Service</AlertTitle>
                    <AlertDescription>
                    This provider primarily offers services under the <span className="font-semibold">{provider.category.replace('-', ' ')}</span> category. Contact them for specific needs.
                    </AlertDescription>
                </Alert>
            )}
             {(!provider.servicesOffered || provider.servicesOffered.length === 0) && provider.category === "other" && provider.otherCategoryDescription && (
                 <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Primary Service</AlertTitle>
                    <AlertDescription>
                    This provider offers: <span className="font-semibold">{provider.otherCategoryDescription}</span>. Contact them for specific needs.
                    </AlertDescription>
                </Alert>
            )}


            <Separator />
            <section>
               <h2 className="text-xl font-semibold text-primary mb-3">Contact Information</h2>
               <div className="space-y-2 text-sm text-foreground/90">
                {provider.contactInfo.phone && (
                  <p className="flex items-center"><Phone className="w-4 h-4 mr-2 text-muted-foreground" /> {provider.contactInfo.phone}</p>
                )}
                {provider.contactInfo.email && (
                  <p className="flex items-center"><Mail className="w-4 h-4 mr-2 text-muted-foreground" /> {provider.contactInfo.email}</p>
                )}
                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-muted-foreground" /> {provider.address}</p>
              </div>
            </section>
            <Separator />
             <section>
               <h2 className="text-xl font-semibold text-primary mb-3">Availability & Rates</h2>
                <div className="space-y-2 text-sm text-foreground/90">
                    <p className="flex items-start"><Clock className="w-4 h-4 mr-2 text-muted-foreground mt-1" /> <span>{formatAvailabilityForProfile(provider.availability)}</span></p>
                    {formatRatesForProfile(provider.rates)}
                </div>
            </section>
          </div>

          <div className="md:col-span-1 space-y-4">
            <Card className="bg-background">
              <CardHeader>
                <CardTitle className="text-lg text-center">Overall Rating</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center text-4xl font-bold text-primary">
                  <Star className="w-8 h-8 mr-2 text-yellow-400 fill-yellow-400" />
                  {provider.overallRating.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">({reviews.length} reviews)</p>
              </CardContent>
            </Card>
            <Button size="lg" className="w-full" asChild>
                <Link href={`/request-service?providerId=${provider.id}`}>Request Service</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {reviews && <ReviewSummary reviews={reviews} providerName={provider.name} />}
      
      <div className="grid md:grid-cols-3 gap-8" id="reviews">
        <section className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-primary flex items-center">
            <Star className="w-6 h-6 mr-2 text-primary" /> Customer Reviews
          </h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet for this provider.</p>
          )}
        </section>

        <section className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary flex items-center">
                <MessageSquarePlus className="w-5 h-5 mr-2" /> Leave a Review
              </CardTitle>
              <CardDescription>Share your experience with {provider.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm providerId={provider.id} onSubmitReview={handleReviewSubmit} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
