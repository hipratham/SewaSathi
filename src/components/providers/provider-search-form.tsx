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
import { MapPin, Search, LocateFixed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  serviceType: z.custom<ServiceCategory>(),
  location: z.string().min(3, { message: "Location must be at least 3 characters." }),
});

export default function ProviderSearchForm() {
  const router = useRouter();
  const { toast } = useToast();

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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For now, just set a placeholder. In a real app, you'd reverse geocode.
          form.setValue("location", `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`);
          toast({ title: "Location Acquired", description: "Current location set." });
        },
        (error) => {
          console.error("Error getting location", error);
          toast({ variant: "destructive", title: "Location Error", description: "Could not get current location." });
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
                <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location">
                  <LocateFixed className="h-5 w-5" />
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
