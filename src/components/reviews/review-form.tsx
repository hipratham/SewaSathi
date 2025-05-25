"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";

const reviewFormSchema = z.object({
  userName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  rating: z.number().min(1, { message: "Please select a rating." }).max(5),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters." }),
});

interface ReviewFormProps {
  providerId: string;
  onSubmitReview: (data: z.infer<typeof reviewFormSchema>) => void; // Callback to handle submission
}

export default function ReviewForm({ providerId, onSubmitReview }: ReviewFormProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      userName: "",
      rating: 0,
      comment: "",
    },
  });

  const currentRating = form.watch("rating");

  function handleSubmit(values: z.infer<typeof reviewFormSchema>) {
    console.log("Review submitted for provider:", providerId, values);
    onSubmitReview(values); // Pass data to parent or state management
    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-7 h-7 cursor-pointer transition-colors",
                        (hoverRating || currentRating) >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground hover:text-yellow-300"
                      )}
                      onClick={() => form.setValue("rating", star, { shouldValidate: true })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your experience..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Submit Review</Button>
      </form>
    </Form>
  );
}
