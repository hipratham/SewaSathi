
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
import { serviceCategories, type ServiceCategory, type RateType, rateTypeOptions } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, LocateFixed, Loader2 } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const daysOfWeek = [
  { id: "Mon", label: "Mon" },
  { id: "Tue", label: "Tue" },
  { id: "Wed", label: "Wed" },
  { id: "Thu", label: "Thu" },
  { id: "Fri", label: "Fri" },
  { id: "Sat", label: "Sat" },
  { id: "Sun", label: "Sun" },
] as const;

const providerProfileSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  category: z.custom<ServiceCategory>((val) => serviceCategories.map(sc => sc.value).includes(val as ServiceCategory), {
    message: "Please select a valid service category.",
  }),
  otherCategoryDescription: z.string().optional(),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }),
  servicesOfferedDescription: z.string().optional(), 
  rateType: z.custom<RateType>((val) => rateTypeOptions.map(rt => rt.value).includes(val as RateType), {
    message: "Please select a valid rate type.",
  }),
  rateAmount: z.coerce.number().positive({ message: "Amount must be a positive number." }).optional(),
  rateDetails: z.string().max(200, { message: "Rate details should be concise (max 200 characters)." }).optional(),
  availableDays: z.array(z.string()).nonempty({ message: "Please select at least one available day." }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  availabilityNotes: z.string().optional(),
})
.refine(data => {
  if (data.category === 'other') {
    return data.otherCategoryDescription && data.otherCategoryDescription.trim().length >= 10;
  }
  return true;
}, {
  message: "Please describe your service if 'Other' is selected (min 10 characters).",
  path: ["otherCategoryDescription"],
})
.refine(data => {
  if (data.startTime && !data.endTime) {
    return false; 
  }
  if (!data.startTime && data.endTime) {
    return false; 
  }
  if (data.startTime && data.endTime) {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    if (endH < startH || (endH === startH && endM <= startM)) {
      return false; 
    }
  }
  return true;
}, {
  message: "End time must be after start time. Both are required if one is provided.",
  path: ["endTime"],
})
.refine(data => {
  const amountRequiredTypes: RateType[] = ["per-hour", "per-job", "fixed-project"];
  if (amountRequiredTypes.includes(data.rateType) && (data.rateAmount === undefined || data.rateAmount <= 0)) {
    return false;
  }
  return true;
}, {
  message: "A positive amount is required for this rate type.",
  path: ["rateAmount"],
})
.refine(data => {
    if(data.rateType === "varies" && (!data.rateDetails || data.rateDetails.trim().length < 5)) {
        return false;
    }
    return true;
}, {
    message: "Please provide some details if rates vary (e.g., a price range or how it's calculated, min 5 characters).",
    path: ["rateDetails"]
});


export default function ProviderProfileForm() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<z.infer<typeof providerProfileSchema>>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      servicesOfferedDescription: "",
      rateType: "varies",
      rateAmount: undefined,
      rateDetails: "",
      availableDays: [],
      startTime: "",
      endTime: "",
      availabilityNotes: "",
      otherCategoryDescription: "",
    },
  });

  const selectedCategory = form.watch("category");
  const selectedRateType = form.watch("rateType");

  function onSubmit(values: z.infer<typeof providerProfileSchema>) {
    const availabilityData = {
        days: values.availableDays,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.availabilityNotes,
    };
    
    const servicesArray = values.servicesOfferedDescription
      ? values.servicesOfferedDescription.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const ratesData = {
        type: values.rateType,
        amount: values.rateAmount,
        details: values.rateDetails,
    };

    const submissionData = { 
      ...values, 
      servicesOffered: servicesArray, 
      availability: availabilityData,
      rates: ratesData, 
      otherCategoryDescription: values.category === 'other' ? values.otherCategoryDescription : undefined,
    };

    delete submissionData.servicesOfferedDescription;
    delete submissionData.availableDays;
    delete submissionData.startTime;
    delete submissionData.endTime;
    delete submissionData.availabilityNotes;
    delete submissionData.rateType;
    delete submissionData.rateAmount;
    delete submissionData.rateDetails;


    console.log("Provider profile submitted:", submissionData);
    toast({
      title: "Profile Saved!",
      description: "Your service provider profile has been submitted (mock).",
    });
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
              form.setValue("address", formattedAddress, { shouldValidate: true });
              toast({ title: "Location Set", description: `Address updated to: ${formattedAddress}. Please verify.` });
            } else if (data.display_name) {
              form.setValue("address", data.display_name, { shouldValidate: true });
               toast({ title: "Location Set", description: `Address updated to: ${data.display_name}. Please verify.` });
            }
             else {
              form.setValue("address", `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}. Please refine.`, { shouldValidate: true });
              toast({ title: "Coordinates Set", description: "Could not fetch full address. Coordinates set. Please refine." });
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            form.setValue("address", `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}. Refine manually.`, { shouldValidate: true });
            toast({ variant:"destructive", title: "Geocoding Error", description: "Could not fetch address. Using coordinates." });
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
                    form.setValue('otherCategoryDescription', ''); 
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
                 <Button type="button" variant="outline" onClick={handleUseCurrentLocation} aria-label="Use current location" disabled={isLocating}>
                  {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
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
                <FormLabel>Phone Number</FormLabel>
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
                <FormLabel>Email Address</FormLabel>
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
          name="servicesOfferedDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services Offered (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the specific services you provide, separated by commas (e.g., Leak repair, faucet installation, drain unblocking)."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>This helps clients understand your expertise. If left blank, your category will be the primary service indicator.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rateType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate Structure</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select how you charge" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rateTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedRateType && ["per-hour", "per-job", "fixed-project"].includes(selectedRateType) && (
            <FormField
                control={form.control}
                name="rateAmount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Amount (NPR)</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="e.g., 800" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <FormField
            control={form.control}
            name="rateDetails"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Additional Rate Details {selectedRateType === "varies" || selectedRateType === "free-consultation" ? "" : "(Optional)"}</FormLabel>
                <FormControl>
                <Textarea
                    placeholder={
                        selectedRateType === "varies" 
                        ? "Explain how your rates are determined (e.g., Rs. 500 - Rs. 1000 depending on complexity, or describe how it's calculated)." 
                        : selectedRateType === "free-consultation"
                        ? "Describe what the free consultation includes (e.g., 30-min initial assessment)."
                        : "Any extra info about your rates (e.g., minimum charges, what's included, travel fees if applicable)."
                    }
                    className="resize-none"
                    rows={3}
                    {...field}
                />
                </FormControl>
                 <FormDescription>
                    {selectedRateType === "varies" 
                        ? "This explanation is important if your rates are not fixed. Please provide details (min 5 characters)."
                        : selectedRateType === "free-consultation" 
                        ? "Clearly state what the free consultation entails." 
                        : "Add any clarifications about your pricing."
                    }
                 </FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />


        <FormField
          control={form.control}
          name="availableDays"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Available Days</FormLabel>
                <FormDescription>
                  Select the days you are typically available.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="availableDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), day.id])
                                  : field.onChange(
                                      (field.value || []).filter(
                                        (value) => value !== day.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typical Daily Start Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Typical Daily End Time (Optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="availabilityNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Availability Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Weekends by appointment only, Not available on public holidays"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} 
          Save Profile
        </Button>
      </form>
    </Form>
  );
}

