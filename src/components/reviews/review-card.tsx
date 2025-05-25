import type { Review } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const reviewDate = new Date(review.createdAt);
  const formattedDate = reviewDate.toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Card className="bg-background/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={`https://placehold.co/40x40.png?text=${review.userName.charAt(0)}`} alt={review.userName} data-ai-hint="person avatar"/>
              <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-md font-semibold">{review.userName}</CardTitle>
          </div>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90 mb-2">{review.comment}</p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </CardContent>
    </Card>
  );
}
