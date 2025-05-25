
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serviceCategories, type ServiceCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, LocateFixed } from "lucide-react";

const providerProfileSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  category: z.custom<ServiceCategory>((val) => serviceCategories.map(sc => sc.value).includes(val as ServiceCategory), {
    message: "Please select a valid service category.",
  }),
  otherCategoryDescription: z.string().optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  servicesOffered: z.string().min(10, { message: "Describe services offered (min 10 characters)." }),
  rates: z.string().min(3, { message: "Rates description is required." }),
  availability: z.string().min(5, { message: "Availability information is required." }),
}).refine(data => {
  if (data.category === 'other') {
    return data.otherCategoryDescription && data.otherCategoryDescription.trim().length >= 10;
  }
  return true;
}, {
  message: "Please describe your service if 'Other' is selected (min 10 characters).",
  path: ["otherCategoryDescription"],
});

export default function ProviderProfileForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof providerProfileSchema>>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      servicesOffered: "",
      rates: "",
      availability: "",
      otherCategoryDescription: "",
    },
  });

  const selectedCategory = form.watch("category");

  function onSubmit(values: z.infer<typeof providerProfileSchema>) {
    console.log("Provider profile submitted:", values);
    // In a real app, this would be an API call
    // For now, just show a success toast
    toast({
      title: "Profile Saved!",
      description: "Your service provider profile has been submitted (mock).",
    });
    form.reset(); // Optionally reset form
  }
  
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("address", `Approx. Lat: ${position.coords.latitude.toFixed(3)}, Lon: ${position.coords.longitude.toFixed(3)} (Please refine your address)`);
          toast({ title: "Location Acquired", description: "Approximate location set. Please refine your address details." });
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
              <FormLabel>Your Full Name or Business Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Sita Kumari or Sita's Repair Shop" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Category</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== 'other') {
                    form.setValue('otherCategoryDescription', ''); // Clear if not 'other'
                  }
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary service category" />
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

        {selectedCategory === "other" && (
          <FormField
            control={form.control}
            name="otherCategoryDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe Your "Other" Service</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please specify the type of service you offer (min 10 characters)."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Address / Service Area</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="e.g. Kalanki, Kathmandu" {...field} />
                </FormControl>
                 <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location">
                  <LocateFixed className="h-5 w-5" />
                </Button>
              </div>
              <FormDescription>Provide your main operating address or service area.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g. 98XXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="e.g. your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <FormField
          control={form.control}
          name="servicesOffered"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services Offered</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the specific services you provide, e.g., Leak repair, faucet installation, drain unblocking."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>This should be a general list of services related to your chosen category. If 'Other', specify your main service in the dedicated field above.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rates</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Rs. 800/hour, Rs. 1500 per bike service" {...field} />
              </FormControl>
              <FormDescription>Be clear about your pricing structure.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Availability</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mon-Fri 9am-5pm, Weekends by appointment" {...field} />
              </FormControl>
              <FormDescription>Let customers know when you are available.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6">
          <Save className="mr-2 h-5 w-5" /> Save Profile
        </Button>
      </form>
    </Form>
  );
}
