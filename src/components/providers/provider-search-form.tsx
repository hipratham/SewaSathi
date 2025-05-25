
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
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Search values:", values);
    // Navigate to providers list page with query params
    const query = new URLSearchParams({
      service: values.serviceType,
      location: values.location,
      // clientName: values.name, // Not typically used for search results page, but for request
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
            
            let formattedAddress = "";
            if (data.address) {
              const addr = data.address;
              if (addr.road) formattedAddress += addr.road;
              if (addr.suburb) formattedAddress += (formattedAddress ? ", " : "") + addr.suburb;
              if (addr.city_district) formattedAddress += (formattedAddress ? ", " : "") + addr.city_district;
              else if (addr.city) formattedAddress += (formattedAddress ? ", " : "") + addr.city;
              else if (addr.town) formattedAddress += (formattedAddress ? ", " : "") + addr.town;
              else if (addr.village) formattedAddress += (formattedAddress ? ", " : "") + addr.village;
               if (addr.country && (formattedAddress === "" || !formattedAddress.toLowerCase().includes(addr.country.toLowerCase()))) {
                 formattedAddress += (formattedAddress ? ", " : "") + addr.country;
              }
            }
            
            if (formattedAddress) {
              form.setValue("location", formattedAddress, { shouldValidate: true });
              toast({ title: "Location Set", description: `Location updated to: ${formattedAddress}.` });
            } else if (data.display_name) {
               form.setValue("location", data.display_name, { shouldValidate: true });
               toast({ title: "Location Set", description: `Location updated to: ${data.display_name}.` });
            }
            else {
              form.setValue("location", `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`, { shouldValidate: true });
              toast({ title: "Coordinates Set", description: "Could not fetch address. Using coordinates." });
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            form.setValue("location", `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`, { shouldValidate: true });
            toast({ variant: "destructive", title: "Geocoding Error", description: "Could not fetch address. Using coordinates." });
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          toast({ variant: "destructive", title: "Location Error", description: "Could not get current location. Please enter manually." });
          setIsLocating(false);
        }
      );
    } else {
      toast({ variant: "destructive", title: "Location Error", description: "Geolocation is not supported by your browser." });
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input placeholder="e.g. Baneshwor, Kathmandu" {...field} className="pl-10"/>
                  </div>
                </FormControl>
                <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={isLocating}>
                  {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6">
          <Search className="mr-2 h-5 w-5" /> Search Providers
        </Button>
      </form>
    </Form>
  );
}
