"use client"; // Required for hooks like useState, useEffect

import { useParams } from "next/navigation";
import Image from "next/image";
import { mockServiceProviders } from "@/lib/mock-data";
import type { ServiceProvider, Review as ReviewType } from "@/lib/types";
import ServiceCategoryIcon from "@/components/icons/service-category-icon";
import ReviewCard from "@/components/reviews/review-card";
import ReviewSummary from "@/components/reviews/review-summary";
import ReviewForm from "@/components/reviews/review-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } ઉfrom "@/components/ui/button";
import { Star, MapPin, Phone, Mail, Clock, MessageSquarePlus, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import Link from "next/link";

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
      id: `review-${Date.now()}`, // Simple unique ID for mock
      userId: 'currentUser', // Mock current user
      userName: newReviewData.userName,
      rating: newReviewData.rating,
      comment: newReviewData.comment,
      createdAt: new Date().toISOString(),
    };
    // Update local state. In a real app, this would be an API call.
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    
    // Update provider's overall rating (mock)
    const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
    const newOverallRating = updatedReviews.length > 0 ? parseFloat((totalRating / updatedReviews.length).toFixed(1)) : 0;
    
    setProvider(prev => prev ? {...prev, reviews: updatedReviews, overallRating: newOverallRating} : null);

    // Also update the mockServiceProviders array if you need persistence across navigations (for demo only)
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
            layout="fill"
            objectFit="cover"
            data-ai-hint="business cover photo"
            className="bg-muted"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{provider.name}</h1>
            <div className="flex items-center text-sm text-primary-foreground/80 mt-1">
              <ServiceCategoryIcon category={provider.category} className="w-5 h-5 mr-2" />
              <span>{provider.category.charAt(0).toUpperCase() + provider.category.slice(1).replace('-', ' ')}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-primary mb-3">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {provider.servicesOffered.map((service) => (
                  <Badge key={service} variant="secondary" className="text-sm">{service}</Badge>
                ))}
              </div>
            </section>
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
                <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-muted-foreground" /> Availability: {provider.availability}</p>
                <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-muted-foreground" /> Rates: <span className="font-semibold">{provider.rates}</span></p>
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
      
      <div className="grid md:grid-cols-3 gap-8">
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
