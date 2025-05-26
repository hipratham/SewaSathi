
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
import { useState, useEffect } from "react";
import { CheckCircle, Send, CreditCard, Gift, Loader2, Info, Phone, Mail } from "lucide-react"; // Added Mail icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useAuth } from "@/context/auth-context"; // Import useAuth

const serviceRequestSchema = z.object({
  userName: z.string().min(2, { message: "Name is required." }),
  userEmail: z.string().email({ message: "Please enter a valid email address." }), // Added email field
  userPhone: z.string().min(10, { message: "Your phone number is required (at least 10 digits)." }),
  location: z.string().min(3, { message: "Location is required." }),
  serviceNeeded: z.string().min(10, { message: "Please describe your needs (min. 10 characters)." }),
  tipAmount: z.coerce.number().nonnegative({message: "Tip amount cannot be negative."}).optional(),
});

interface ServiceRequestFormProps {
  providerId?: string; 
}

export default function ServiceRequestForm({ providerId }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext
  const [requestStatus, setRequestStatus] = useState<"form" | "payment" | "pending_acceptance" | "accepted" | "job_done" | "completed">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [mockProviderContact, setMockProviderContact] = useState<string | null>(null);

  const form = useForm<z.infer<typeof serviceRequestSchema>>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      userName: "",
      userEmail: "", // Default for email
      userPhone: "",
      location: "",
      serviceNeeded: "",
      tipAmount: 0,
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("userName", user.displayName || user.email?.split('@')[0] || "");
      form.setValue("userEmail", user.email || "");
    }
  }, [user, form]);

  const mockApiCall = (duration = 1500) => new Promise(resolve => setTimeout(resolve, duration));

  async function onSubmit(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    console.log("Service request submitted:", values, "for provider:", providerId);
    
    const requestTime = new Date().toLocaleString();
    console.log(
      `Simulating notification to provider ${providerId || 'N/A'}: ` +
      `New service request from ${values.userName} (Email: ${values.userEmail}, Phone: ${values.userPhone}). ` +
      `Location: ${values.location}. Needs: ${values.serviceNeeded}. Time: ${requestTime}`
    );

    await mockApiCall();
    setRequestStatus("payment");
    setIsLoading(false);
    toast({
      title: "Details Submitted (Simulation)",
      description: `Provider would be notified with your details (Name: ${values.userName}, Email: ${values.userEmail}, Phone: ${values.userPhone}, Request Time: ${requestTime}). Please complete the Rs. 100 initial service fee payment to proceed.`,
      variant: "default",
    });
  }

  async function handlePaymentConfirmation() {
    setIsLoading(true);
    await mockApiCall(); 
    setRequestStatus("pending_acceptance");
    setIsLoading(false);
    toast({
      title: "Payment Received!",
      description: "Your request is being processed. We will notify you once a provider accepts.",
      variant: "default",
    });
    
    setTimeout(async () => {
      setIsLoading(true);
      await mockApiCall(); 
      const randomProviderPhone = `98X${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
      setMockProviderContact(`Provider Name (Mock), Phone: ${randomProviderPhone}`);
      setRequestStatus("accepted");
      setIsLoading(false);
      toast({
        title: "Request Accepted!",
        description: "A provider has accepted your request. Their contact details have been shared (mock).",
        variant: "default",
      });
    }, 3000);
  }
  
  async function handleJobDone() {
    setIsLoading(true);
    await mockApiCall();
    setRequestStatus("job_done");
    setIsLoading(false);
    toast({
      title: "Job Marked as Done",
      description: "Great! You can now add an optional tip for the provider and rate their service.",
      variant: "default",
    });
  }

  async function handleAddTip(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    await mockApiCall();
    const tip = values.tipAmount || 0;
    console.log("Tip added:", tip);
    setRequestStatus("completed");
    setIsLoading(false);
    toast({
      title: "Service Complete!",
      description: tip > 0 ? `Thank you for adding a tip of Rs. ${tip}.` : "Thank you for using SewaSathi!",
      variant: "default",
    });
  }

  if (requestStatus === "payment") {
    return (
      <div className="space-y-6 p-4 md:p-6 bg-card rounded-lg shadow-lg">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Payment Required</AlertTitle>
          <AlertDescription>
            Please pay the initial service fee of Rs. 100 using the eSewa QR code below.
          </AlertDescription>
        </Alert>
        <EsewaQrCode amount={100} description="Initial Service Request Fee" />
        <Button onClick={handlePaymentConfirmation} className="w-full text-lg py-3" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
          I Have Paid
        </Button>
      </div>
    );
  }

  if (requestStatus === "pending_acceptance") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md space-y-4">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-semibold text-primary">Request Pending</h2>
        <p className="text-muted-foreground">We've received your payment and are now waiting for a service provider to accept your request. You will be notified shortly.</p>
      </div>
    );
  }
  
  if (requestStatus === "accepted") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md space-y-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold text-primary">Request Accepted!</h2>
        <p className="text-muted-foreground">
          Your service request has been accepted.
        </p>
        <Alert variant="default" className="text-left">
            <Info className="h-4 w-4"/>
            <AlertTitle>Provider Details (Mock)</AlertTitle>
            <AlertDescription>
                {mockProviderContact || "Provider contact details will appear here."}
            </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">Once the service is completed by the provider, please mark it as done below.</p>
        <Button onClick={handleJobDone} className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Mark Job as Done
        </Button>
      </div>
    );
  }

  if (requestStatus === "job_done") {
     return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddTip)} className="space-y-6 p-6 md:p-8 bg-card rounded-lg shadow-lg">
          <div className="text-center space-y-3">
            <Gift className="mx-auto h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-primary">Job Completed!</h2>
            <p className="text-muted-foreground">Hope you were satisfied with the service. You can add an optional tip for the provider below.</p>
          </div>
          <FormField
            control={form.control}
            name="tipAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add Tip (Optional, in Rs.)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 50" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} min="0" />
                </FormControl>
                <FormDescription>Enter the amount you'd like to tip.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
            Add Tip & Finalize
          </Button>
           {providerId && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              Don't forget to <Link href={`/providers/${providerId}#reviews`} className="underline text-primary hover:text-primary/80">rate your provider</Link>!
            </p>
           )}
        </form>
      </Form>
     );
  }

  if (requestStatus === "completed") {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold text-primary">Thank You!</h2>
        <p className="text-muted-foreground">Your service request is now complete. We appreciate your business!</p>
        {providerId && (
         <Button asChild variant="outline">
            <Link href={`/providers/${providerId}#reviews`}>Rate Provider</Link>
          </Button>
        )}
         <Button asChild>
            <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 md:p-8 bg-card rounded-lg shadow-lg">
        {providerId && 
            <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Specific Provider Selected</AlertTitle>
                <AlertDescription>
                You are requesting service from a specific provider. Your request will be sent to them upon payment.
                </AlertDescription>
            </Alert>
        }
        <FormField
          control={form.control}
          name="userName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email</FormLabel>
              <FormControl>
                 <div className="relative flex items-center">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="e.g. you@example.com" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Phone Number</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" placeholder="e.g. 98XXXXXXXX" {...field} className="pl-10" />
                </div>
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
              <FormLabel>Your Service Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Maitidevi, Kathmandu (Provide specific address)" {...field} />
              </FormControl>
               <FormDescription>Where do you need the service?</FormDescription>
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
                  placeholder="e.g., My kitchen sink is leaking and needs urgent repair. OR I need a math tutor for Class 10, CBSE curriculum."
                  className="resize-none"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>Be as detailed as possible.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
          Submit Request & Proceed to Pay Rs. 100
        </Button>
      </form>
    </Form>
  );
}
