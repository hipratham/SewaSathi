
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
import { Send, Loader2, Info, Phone, Mail, LocateFixed, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const serviceRequestSchema = z.object({
  userName: z.string().min(2, { message: "Name is required." }),
  userEmail: z.string().email({ message: "Please enter a valid email address." }),
  userPhone: z.string().min(10, { message: "Your phone number is required (at least 10 digits)." }),
  location: z.string().min(3, { message: "Location is required." }),
  serviceNeeded: z.string().min(10, { message: "Please describe your needs (min. 10 characters)." }),
});

interface ServiceRequestFormProps {
  providerId?: string;
}

export default function ServiceRequestForm({ providerId }: ServiceRequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
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
      serviceNeeded: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("userName", user.displayName || user.email?.split('@')[0] || "");
      form.setValue("userEmail", user.email || "");
      // Consider pre-filling phone if available and verified in user's main profile
    }
  }, [user, form]);

  const mockApiCall = (duration = 1500) => new Promise(resolve => setTimeout(resolve, duration));

  async function onSubmit(values: z.infer<typeof serviceRequestSchema>) {
    setIsLoading(true);
    console.log("Service request submitted:", values, "for provider:", providerId);

    const requestTime = new Date().toLocaleString();
    // In a real app, you'd send this data to your backend/Firebase
    // For now, we simulate success
    await mockApiCall();

    // Example: Update mockServiceRequests or a global state if using for demo
    // For now, just log and show success
    console.log(
      `Simulating notification for provider ${providerId || 'N/A'}: ` +
      `New service request from ${values.userName} (Email: ${values.userEmail}, Phone: ${values.userPhone}). ` +
      `Location: ${values.location}. Needs: ${values.serviceNeeded}. Time: ${requestTime}`
    );

    setIsLoading(false);
    setIsSubmitted(true);
    toast({
      title: "Request Submitted Successfully!",
      description: `Your service request for "${values.serviceNeeded.substring(0, 30)}..." has been sent. You will be contacted by a provider if your request is accepted.`,
      variant: "default",
      duration: 7000,
    });
    form.reset(); // Reset form after successful submission
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

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-card rounded-lg shadow-md space-y-4">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold text-primary">Request Submitted!</h2>
        <p className="text-muted-foreground">Thank you for your request. A service provider will contact you if they can fulfill your needs. You can view your request status on your dashboard (coming soon).</p>
        <Button asChild>
          <Link href={providerId ? `/providers/${providerId}` : "/providers"}>
            {providerId ? "Back to Provider Profile" : "Find More Providers"}
          </Link>
        </Button>
         <Button asChild variant="outline">
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
                You are requesting service from a specific provider. Your request will be sent directly to them.
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
                    <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={isLocating}>
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
          name="serviceNeeded"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe Your Needs (Remarks)</FormLabel>
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
          Submit Request
        </Button>
      </form>
    </Form>
  );
}
