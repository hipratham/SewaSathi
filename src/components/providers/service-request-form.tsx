
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
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, type ChangeEvent } from "react";
import { Send, Loader2, Info, Phone, Mail, LocateFixed, CheckCircle, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { database } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";
import type { ServiceRequest } from "@/lib/types";

const serviceRequestSchema = z.object({
  userName: z.string().min(2, { message: "Name is required." }),
  userEmail: z.string().email({ message: "Please enter a valid email address." }),
  userPhone: z.string().min(10, { message: "Your phone number is required (at least 10 digits)." }),
  location: z.string().min(3, { message: "Location is required." }),
  taskDetails: z.string().optional(),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number."}).optional().nullable(),
  preferredDate: z.date().optional().nullable(),
});

interface ServiceRequestFormProps {
  providerIdFromModal?: string; // Renamed to avoid confusion with internal providerId
  onOfferSubmit?: (offerData: any) => void; 
}

export default function ServiceRequestForm({ providerIdFromModal, onOfferSubmit }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Determine the providerId: prioritize modal prop, then search params
  const providerId = providerIdFromModal || searchParams.get("providerId") || undefined;

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof serviceRequestSchema>>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
      userPhone: "",
      location: "",
      taskDetails: "",
      budget: undefined,
      preferredDate: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("userName", user.displayName || user.email?.split('@')[0] || "");
      form.setValue("userEmail", user.email || "");
      // Consider fetching user's phone from their profile if available
    }
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    console.log("ServiceRequestForm: Attempting to submit offer. Target Provider ID:", providerId);

    if (!providerId) {
        toast({ title: "Error", description: "Provider ID is missing. Cannot send offer.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    if (!user?.uid) {
        toast({ title: "Authentication Error", description: "You must be logged in to send an offer.", variant: "destructive"});
        setIsLoading(false);
        // Optionally redirect to login: router.push('/auth/signin');
        return;
    }
    
    const offersRef = ref(database, 'serviceRequests');
    const newOfferRef = push(offersRef); // Generate a unique key for the new offer

    const newOfferData: Omit<ServiceRequest, 'id'> & { id?: string } = { // id will be set by Firebase key
      userId: user.uid,
      clientName: values.userName,
      clientEmail: values.userEmail,
      clientPhone: values.userPhone,
      clientAddress: values.location,
      taskDetails: values.taskDetails || "No specific details provided.",
      budget: values.budget || null,
      preferredDate: values.preferredDate ? values.preferredDate.toISOString().split('T')[0] : null,
      requestedAt: new Date().toISOString(),
      providerId: providerId, // Essential: ID of the targeted provider
      status: "offer_sent_to_provider",
    };

    try {
      await set(newOfferRef, newOfferData);
      const offerId = newOfferRef.key; // Get the generated ID
      console.log("ServiceRequestForm: Offer submitted to Firebase with ID:", offerId, newOfferData);

      if (onOfferSubmit) { // If used as a modal component
          onOfferSubmit({...newOfferData, id: offerId}); // Pass data back to parent
          toast({
              title: "Offer Sent!",
              description: "Your offer has been sent to the provider.",
          });
          form.reset(); // Reset form after successful modal submission
      } else { // If used as a standalone page
        setIsSubmitted(true); // Trigger success UI for standalone page
        toast({
          title: "Offer Sent Successfully!",
          description: `Your offer has been sent. You can track its status on your dashboard. Offer ID: ${offerId}`,
          variant: "default",
          duration: 7000,
        });
      }
    } catch (error: any) {
      console.error("ServiceRequestForm: Error submitting offer to Firebase:", error);
      toast({
        title: "Offer Submission Failed",
        description: error.message || "Could not send your offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (!onOfferSubmit) { // Only reset form on standalone page if not handled by modal close
         // form.reset(); // Let standalone page show success message before reset or redirect
      }
    }
  }

  const handleUseCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);
            const data = await response.json();

            let displayAddress = "";
            const addr = data.address;

            if (addr) {
                const parts: string[] = [];
                if (addr.road) parts.push(addr.road);
                const locality = addr.neighbourhood || addr.suburb || addr.quarter;
                if (locality) parts.push(locality);

                const cityLevel = addr.city || addr.town || addr.village || addr.city_district;
                if (cityLevel && !parts.some(p => p.toLowerCase() === cityLevel.toLowerCase())) parts.push(cityLevel);
                
                const country = addr.country;
                if (country && parts.length > 0 && !parts.some(p => p.toLowerCase() === country.toLowerCase())) parts.push(country);

                const uniqueParts = parts.filter((part, index, self) => part && self.findIndex(p => p.toLowerCase().trim() === part.toLowerCase().trim()) === index);

                if (uniqueParts.length > 1) { 
                    displayAddress = uniqueParts.join(', ');
                } else if (data.display_name) { 
                    displayAddress = data.display_name;
                }
            } else if (data.display_name) {
                 displayAddress = data.display_name;
            }

            if (!displayAddress) {
                displayAddress = `Approx. Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}. IMPORTANT: Please verify & refine.`;
            }

            form.setValue("location", displayAddress, { shouldValidate: true });
            toast({
              title: "Location Approximated",
              description: `Address set to: "${displayAddress}". IMPORTANT: Please verify this address and correct it if needed. Geolocation can be imprecise.`,
              duration: 9000,
            });
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            form.setValue("location", `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}. Could not fetch address; please enter manually and verify.`, { shouldValidate: true });
            toast({
                variant:"destructive",
                title: "Geocoding Error",
                description: "Could not fetch address details. Using coordinates. IMPORTANT: Please enter manually and verify.",
                duration: 9000,
            });
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          toast({
            variant: "destructive",
            title: "Location Access Error",
            description: "Could not get current location. Please ensure location services are enabled and permissions are granted, then try again or enter manually.",
            duration: 9000,
          });
          setIsLocating(false);
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported by your browser. Please enter your address manually.",
        duration: 9000,
      });
    }
  };

  if (isSubmitted && !onOfferSubmit) { 
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold text-primary">Offer Sent!</h2>
        <p className="text-muted-foreground">Thank you for your offer. The provider has been notified. You can track its progress on your dashboard.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href={providerId ? `/providers/${providerId}` : "/providers"}>
              {providerId ? "Back to Provider Profile" : "Find More Providers"}
            </Link>
          </Button>
          <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
          </Button>
           <Button asChild variant="secondary">
              <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        {providerId && !onOfferSubmit && 
            <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Sending Offer to Specific Provider</AlertTitle>
                <AlertDescription>
                Your offer will be sent directly to the selected provider. Provider ID: {providerId.substring(0,10)}...
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
                <div className="flex gap-2">
                    <FormControl>
                        <Input placeholder="e.g. Maitidevi, Kathmandu (Verify if auto-filled)" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={isLocating}>
                        {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                    </Button>
                </div>
               <FormDescription>Where do you need the service? If using auto-location, please verify its accuracy.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="taskDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Details (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the task or service you need..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>The more details you provide, the better the provider can assess the offer.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Budget (Optional, NPR)</FormLabel>
               <FormControl>
                 <div className="relative flex items-center">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" placeholder="e.g., 1500" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value))} className="pl-10"/>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Preferred Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={(date) => field.onChange(date)}
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate() - 1)) 
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading || !providerId}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
          Send Offer
        </Button>
        {!providerId && 
            <p className="text-xs text-destructive text-center">Provider ID is missing. Cannot send offer. Please select a provider first.</p>
        }
      </form>
    </Form>
  );
}
    