
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceCategories, type ServiceCategory } from "@/lib/types";
import { MapPin, Search, LocateFixed, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  serviceType: z.custom<ServiceCategory>((val) => serviceCategories.map(sc => sc.value).includes(val as ServiceCategory),{
    message: "Please select a service type"
  }),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
});

export default function ProviderSearchForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      // Ensure serviceType has a default if it can be undefined, or remove if not needed
      // serviceType: undefined, 
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Search values:", values);
    const query = new URLSearchParams({
      service: values.serviceType,
      location: values.location,
    }).toString();
    router.push(`/providers?${query}`);
  }

  const handleUseCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            if (!response.ok) {
              throw new Error(`Nominatim API error: ${response.statusText}`);
            }
            const data = await response.json();
            
            let displayAddress = "";
            const addr = data.address;

            if (addr) {
                const parts: string[] = [];
                if (addr.road) parts.push(addr.road);
                if (addr.neighbourhood) parts.push(addr.neighbourhood);
                else if (addr.suburb) parts.push(addr.suburb);
                
                const cityLevel = addr.city || addr.town || addr.village || addr.city_district;
                 if (cityLevel && !parts.some(p => p.toLowerCase() === cityLevel.toLowerCase())) {
                    parts.push(cityLevel);
                 }

                const country = addr.country;
                if (country && parts.length > 0 && !parts.some(p => p.toLowerCase() === country.toLowerCase())) {
                    parts.push(country);
                }
                
                const uniqueParts = parts.filter((part, index, self) => part && self.findIndex(p => p.toLowerCase().trim() === part.toLowerCase().trim()) === index);
                
                if (uniqueParts.length > 0) { 
                    displayAddress = uniqueParts.join(', ');
                }
            }
            
            if (!displayAddress && data.display_name) {
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
                description: "Could not fetch address details. Using coordinates. Please enter manually and verify.",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 md:p-8 bg-card rounded-lg shadow-lg">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Location / Area</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <div className="relative w-full">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="e.g. Baneshwor, Kathmandu (Verify if auto-filled)" {...field} className="pl-10"/>
                  </div>
                </FormControl>
                <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={isLocating}>
                  {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                </Button>
              </div>
              <FormDescription>If using auto-location, please verify its accuracy.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6" disabled={isLocating}>
          <Search className="mr-2 h-5 w-5" /> Search Providers
        </Button>
      </form>
    </Form>
  );
}
