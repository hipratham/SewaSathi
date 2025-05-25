"use client";

import type { Review } from "@/lib/types";
import { summarizeReviews } from "@/ai/flows/review-summarization";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquareText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ReviewSummaryProps {
  reviews: Review[];
  providerName: string;
}

export default function ReviewSummary({ reviews, providerName }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reviews && reviews.length > 0) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const reviewTexts = reviews.map(r => `${r.userName} rated ${r.rating} stars: ${r.comment}`).join("\n\n");
          const result = await summarizeReviews({ reviews: reviewTexts });
          setSummary(result.summary);
        } catch (e) {
          console.error("Error summarizing reviews:", e);
          setError("Failed to generate review summary.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [reviews]);

  if (reviews.length === 0) {
    return (
        <Card className="bg-accent/20 border-accent/50">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                <MessageSquareText className="w-5 h-5 mr-2 text-accent" />
                Review Summary for {providerName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No reviews yet to summarize.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-accent/20 border-accent/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageSquareText className="w-5 h-5 mr-2 text-accent" />
          AI Review Summary for {providerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Generating summary...</p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {summary && !isLoading && !error && (
          <p className="text-sm text-foreground/90 whitespace-pre-line">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}
