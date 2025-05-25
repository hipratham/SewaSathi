"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EsewaQrCode from "@/components/payments/esewa-qr";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle, Send, CreditCard, Gift, Loader2 } from "lucide-react";

const serviceRequestSchema = z.object({
  userName: z.string().min(2, { message: "Name is required." }),
  location: z.string().min(3, { message: "Location is required." }),
  serviceNeeded: z.string().min(10, { message: "Please describe your needs (min. 10 characters)." }),
  tipAmount: z.coerce.number().optional(), // For adding tips later
});

interface ServiceRequestFormProps {
  providerId?: string; // Optional, if request is for a specific provider
}

export default function ServiceRequestForm({ providerId }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const [requestStatus, setRequestStatus] = useState<"form" | "payment" | "pending_acceptance" | "accepted" | "job_done" | "completed">("form");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof serviceRequestSchema>>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      userName: "",
      location: "",
      serviceNeeded: "",
      tipAmount: 0,
    },
  });

  // Mock API call
  const mockApiCall = (duration = 1500) => new Promise(resolve => setTimeout(resolve, duration));


  async function onSubmit(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    console.log("Service request submitted:", values, "for provider:", providerId);
    await mockApiCall();
    // Transition to payment step
    setRequestStatus("payment");
    setIsLoading(false);
    toast({
      title: "Details Submitted",
      description: "Please complete the payment to proceed.",
    });
  }

  async function handlePaymentConfirmation() {
    setIsLoading(true);
    await mockApiCall();
    // Mock admin approval and provider match/acceptance
    setRequestStatus("pending_acceptance");
    setIsLoading(false);
    toast({
      title: "Payment Received!",
      description: "Your request is being processed. We will notify you once a provider accepts.",
    });
    // Simulate provider acceptance after a delay
    setTimeout(async () => {
      setIsLoading(true);
      await mockApiCall();
      setRequestStatus("accepted");
      setIsLoading(false);
      toast({
        title: "Request Accepted!",
        description: "A provider has accepted your request. Contact details shared (mock).",
      });
    }, 3000);
  }
  
  async function handleJobDone() {
    setIsLoading(true);
    await mockApiCall();
    setRequestStatus("job_done");
    setIsLoading(false);
    toast({
      title: "Job Marked as Done (Mock)",
      description: "You can now add a tip and rate the provider.",
    });
  }

  async function handleAddTip(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    await mockApiCall();
    console.log("Tip added:", values.tipAmount);
    setRequestStatus("completed");
    setIsLoading(false);
    toast({
      title: "Tip Added!",
      description: `Thank you for adding a tip of Rs. ${values.tipAmount || 0}.`,
    });
  }


  if (requestStatus === "payment") {
    return (
      <div className="space-y-6">
        <EsewaQrCode amount={100} description="Initial Service Request Fee" />
        <Button onClick={handlePaymentConfirmation} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          I Have Paid
        </Button>
      </div>
    );
  }

  if (requestStatus === "pending_acceptance") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md">
        <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Request Pending</h2>
        <p className="text-muted-foreground">We are waiting for a service provider to accept your request. You will be notified shortly.</p>
      </div>
    );
  }
  
  if (requestStatus === "accepted") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Request Accepted!</h2>
        <p className="text-muted-foreground mb-4">
          Your service request has been accepted.
          Provider Contact (Mock): John Doe - 98XXXXXXXX.
        </p>
        <Button onClick={handleJobDone} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Mark Job as Done (Client Action)
        </Button>
      </div>
    );
  }

  if (requestStatus === "job_done") {
     return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddTip)} className="space-y-6 p-6 md:p-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <Gift className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Job Completed!</h2>
            <p className="text-muted-foreground mb-4">Hope you are satisfied with the service. You can add a tip for the provider below.</p>
          </div>
          <FormField
            control={form.control}
            name="tipAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Tip (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormDescription>Enter the amount you'd like to tip.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Add Tip & Complete
          </Button>
        </form>
      </Form>
     );
  }

  if (requestStatus === "completed") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
        <p className="text-muted-foreground">Your service is complete. We appreciate your business!</p>
        {/* Add link to rate provider here */}
      </div>
    );
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 md:p-8 bg-card rounded-lg shadow-lg">
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
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Maitidevi, Kathmandu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceNeeded"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe Your Needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., My kitchen sink is leaking, I need help with math tution for Class 10."
                  className="resize-none"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {providerId && <p className="text-sm text-muted-foreground">Requesting service from a specific provider (ID: {providerId})</p>}
        <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
