
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
import { serviceCategories, type ServiceCategory, type RateType, rateTypeOptions, type ServiceProviderRates } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Save, LocateFixed, Loader2, Edit, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { database } from "@/lib/firebase";
import { ref, set, get } from "firebase/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  servicesOfferedDescription: z.string().optional(), // Made optional
  rateType: z.custom<RateType>((val) => rateTypeOptions.map(rt => rt.value).includes(val as RateType), {
    message: "Please select a valid rate type.",
  }),
  rateAmount: z.coerce.number().positive({ message: "Amount must be a positive number." }).optional(),
  rateMinAmount: z.coerce.number().positive({ message: "Minimum amount must be positive." }).optional(),
  rateMaxAmount: z.coerce.number().positive({ message: "Maximum amount must be positive." }).optional(),
  rateDetails: z.string().max(200, { message: "Details should be concise (max 200 characters)." }).optional(),
  availableDays: z.array(z.string()).nonempty({ message: "Please select at least one available day." }),
  startTime: z.string().optional().refine(val => val === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM)."}),
  endTime: z.string().optional().refine(val => val === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM)."}),
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
  // If one time is provided, the other must also be provided.
  const startTimeProvided = !!data.startTime;
  const endTimeProvided = !!data.endTime;
  if (startTimeProvided !== endTimeProvided) return false; 
  
  // If both are provided, endTime must be after startTime.
  if (startTimeProvided && endTimeProvided && data.startTime && data.endTime) {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    if (endH < startH || (endH === startH && endM <= startM)) return false;
  }
  return true;
}, {
  message: "End time must be after start time. Both start and end times are required if one is provided, or leave both blank.",
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
  if (data.rateType === "varies") {
    return data.rateMinAmount !== undefined && data.rateMinAmount > 0 &&
           data.rateMaxAmount !== undefined && data.rateMaxAmount > 0;
  }
  return true;
}, {
  message: "Minimum and Maximum amounts are required and must be positive for 'Varies' rate type.",
  path: ["rateMinAmount"], // Apply error to minAmount, or use a general path if needed
})
.refine(data => {
  if (data.rateType === "varies" && data.rateMinAmount && data.rateMaxAmount) {
    return data.rateMaxAmount >= data.rateMinAmount;
  }
  return true;
}, {
  message: "Maximum amount must be greater than or equal to Minimum amount.",
  path: ["rateMaxAmount"],
})
.refine(data => {
    if(data.rateType === "free-consultation" && (!data.rateDetails || data.rateDetails.trim().length < 10)) {
        return false;
    }
    return true;
}, {
    message: "Please describe what the free consultation includes (min 10 characters).",
    path: ["rateDetails"]
});

type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

// Helper function to map database data to form data structure
function mapDbDataToForm(dbData: any): Partial<ProviderProfileFormValues> {
    return {
        name: dbData.name || "",
        category: dbData.category,
        otherCategoryDescription: dbData.otherCategoryDescription || "",
        address: dbData.address || "",
        phone: dbData.contactInfo?.phone || "",
        email: dbData.contactInfo?.email || "",
        servicesOfferedDescription: dbData.servicesOffered?.join(', ') || "",
        rateType: dbData.rates?.type,
        rateAmount: dbData.rates?.amount,
        rateMinAmount: dbData.rates?.minAmount,
        rateMaxAmount: dbData.rates?.maxAmount,
        rateDetails: dbData.rates?.details || "",
        availableDays: dbData.availability?.days || [],
        startTime: dbData.availability?.startTime || "",
        endTime: dbData.availability?.endTime || "",
        availabilityNotes: dbData.availability?.notes || "",
    };
}

// Helper to format current values for confirmation dialog
function formatCurrentValuesForDialog(values: ProviderProfileFormValues, fieldLabels: Record<string, string>): string[] {
    const summary: string[] = [];
    (Object.keys(values) as Array<keyof ProviderProfileFormValues>).forEach(key => {
        const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        let value = values[key];
        
        const isOptionalRateAmount = (key === 'rateAmount' && !["per-hour", "per-job", "fixed-project"].includes(values.rateType));
        const isOptionalMinMax = ((key === 'rateMinAmount' || key === 'rateMaxAmount') && values.rateType !== 'varies');
        const isOptionalOtherDesc = (key === 'otherCategoryDescription' && values.category !== 'other');
        const isOptionalRateDetails = (key === 'rateDetails' && values.rateType !== 'free-consultation');


        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
            if (key === 'servicesOfferedDescription' || 
                isOptionalOtherDesc || 
                isOptionalRateAmount || 
                isOptionalMinMax || 
                isOptionalRateDetails || 
                key === 'startTime' || key === 'endTime' || key === 'availabilityNotes') 
            {
                 summary.push(`${label}: Not set`);
            } else if (value !== undefined) { 
                summary.push(`${label}: ${value}`); // For required fields if they are somehow empty
            }
        } else if (Array.isArray(value)) {
            summary.push(`${label}: ${value.join(', ') || 'None'}`);
        } else {
            summary.push(`${label}: ${value}`);
        }
    });
    return summary;
}

const fieldDisplayLabels: Record<string, string> = {
    name: 'Name',
    category: 'Service Category',
    otherCategoryDescription: 'Other Service Description',
    address: 'Address / Service Area',
    phone: 'Phone Number',
    email: 'Email Address',
    servicesOfferedDescription: 'Services Offered (comma-separated)',
    rateType: 'Rate Structure',
    rateAmount: 'Rate Amount (NPR)',
    rateMinAmount: 'Minimum Rate Amount (NPR)',
    rateMaxAmount: 'Maximum Rate Amount (NPR)',
    rateDetails: 'Rate Details',
    availableDays: 'Available Days',
    startTime: 'Typical Start Time',
    endTime: 'Typical End Time',
    availabilityNotes: 'Availability Notes',
};


export default function ProviderProfileForm() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationSummary, setConfirmationSummary] = useState<string[]>([]);

  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      servicesOfferedDescription: "", // Optional field
      rateType: "varies", 
      rateAmount: undefined,
      rateMinAmount: undefined,
      rateMaxAmount: undefined,
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

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      const profileRef = ref(database, `providerProfiles/${user.uid}`);
      get(profileRef).then((snapshot) => {
        if (snapshot.exists()) {
          const dbData = snapshot.val();
          const formData = mapDbDataToForm(dbData);
          form.reset(formData); 
          setHasExistingProfile(true);
        } else {
          setHasExistingProfile(false);
          if(user.email) form.setValue('email', user.email);
          if(user.displayName) form.setValue('name', user.displayName);
        }
      }).catch(error => {
        console.error("Error fetching provider profile:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load your profile data." });
        setHasExistingProfile(false);
      }).finally(() => {
        setIsLoadingData(false);
      });
    } else {
      setIsLoadingData(false); 
    }
  }, [user, form, toast]);


  async function handleActualSave() {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save a profile." });
      return;
    }
    setIsSubmitting(true);

    const values = form.getValues();
    const servicesArray = values.servicesOfferedDescription
      ? values.servicesOfferedDescription.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const ratesData: ServiceProviderRates = {
        type: values.rateType,
        amount: (values.rateType === "per-hour" || values.rateType === "per-job" || values.rateType === "fixed-project") ? values.rateAmount : undefined,
        minAmount: values.rateType === "varies" ? values.rateMinAmount : undefined,
        maxAmount: values.rateType === "varies" ? values.rateMaxAmount : undefined,
        details: values.rateDetails || undefined,
    };

    const submissionData = {
      userId: user.uid, // Store userId for potential queries
      name: values.name,
      category: values.category,
      otherCategoryDescription: values.category === 'other' ? values.otherCategoryDescription : undefined,
      address: values.address,
      contactInfo: {
        phone: values.phone,
        email: values.email,
      },
      servicesOffered: servicesArray,
      availability: {
          days: values.availableDays,
          startTime: values.startTime || undefined,
          endTime: values.endTime || undefined,
          notes: values.availabilityNotes || undefined,
      },
      rates: ratesData,
      updatedAt: new Date().toISOString(),
    };

    try {
      await set(ref(database, `providerProfiles/${user.uid}`), submissionData);
      toast({
        title: hasExistingProfile ? "Profile Updated!" : "Profile Saved!",
        description: "Your service provider profile has been successfully saved.",
      });
      setHasExistingProfile(true); 
      router.push('/home-provider');
    } catch (error) {
      console.error("Error saving provider profile:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your profile. Please try again." });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  }

  function onSubmit(values: ProviderProfileFormValues) {
    const summary = formatCurrentValuesForDialog(values, fieldDisplayLabels);
    setConfirmationSummary(summary);
    setShowConfirmDialog(true);
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
                // Order of preference for address components
                if (addr.road) parts.push(addr.road);
                if (addr.neighbourhood) parts.push(addr.neighbourhood);
                else if (addr.suburb) parts.push(addr.suburb);
                
                const cityLevel = addr.city || addr.town || addr.village || addr.city_district;
                if (cityLevel) parts.push(cityLevel);

                // Basic duplicate removal and join
                const uniqueParts = parts.filter((part, index, self) => part && self.findIndex(p => p.toLowerCase() === part.toLowerCase()) === index);
                
                if (uniqueParts.length >= 2) { // Require at least two distinct parts for a good constructed address
                    displayAddress = uniqueParts.join(', ');
                }
            }

            if (!displayAddress && data.display_name) {
                displayAddress = data.display_name;
            }
            
            if (!displayAddress) {
                displayAddress = `Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}. Please refine.`;
            }
            
            form.setValue("address", displayAddress, { shouldValidate: true });
            toast({ title: "Location Set", description: `Address updated to: ${displayAddress}. Please verify this address.` });
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

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <>
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
                      form.clearErrors('otherCategoryDescription'); // Clear error if category changes from 'other'
                    }
                  }}
                  value={field.value || ""} 
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
                <FormLabel>Services Offered (Optional, comma-separated)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Leak repair, faucet installation. If blank, your category is the primary indicator."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>This helps clients understand your expertise. Leave blank if your category is specific enough.</FormDescription>
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
                <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                        // Clear dependent fields when rateType changes
                        form.setValue('rateAmount', undefined);
                        form.setValue('rateMinAmount', undefined);
                        form.setValue('rateMaxAmount', undefined);
                        if (value !== 'free-consultation') form.setValue('rateDetails', '');
                        form.clearErrors(['rateAmount', 'rateMinAmount', 'rateMaxAmount', 'rateDetails']);
                    }} 
                    value={field.value || ""}
                >
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
                      <Input type="number" placeholder="e.g., 800" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value))} min="0.01" step="0.01" />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
          )}

          {selectedRateType === "varies" && (
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="rateMinAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Amount (NPR)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 500" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value))} min="0.01" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rateMaxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Amount (NPR)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseFloat(e.target.value))} min="0.01" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
              control={form.control}
              name="rateDetails"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>
                      {selectedRateType === "free-consultation"
                          ? "Describe Free Consultation (Required)"
                          : selectedRateType === "varies"
                          ? "Optional: Further explanation for varied rates"
                          : "Optional: Additional notes about your rate"}
                  </FormLabel>
                  <FormControl>
                  <Textarea
                      placeholder={
                          selectedRateType === "free-consultation"
                          ? "Describe what the free consultation includes (e.g., 30-min initial assessment over phone, min 10 characters)."
                          : selectedRateType === "varies"
                          ? "e.g., Price depends on job complexity, materials needed, and duration."
                          : "e.g., Minimum 2-hour charge, travel fees may apply outside city limits."
                      }
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                  />
                  </FormControl>
                  <FormDescription>
                      {selectedRateType === "free-consultation"
                          ? "This description is required for free consultations."
                          : selectedRateType === "varies"
                          ? "Provide context if the range isn't self-explanatory."
                          : "Add any clarifications about your pricing if needed."
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
                  <FormDescription>Select the days you are typically available.</FormDescription>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {daysOfWeek.map((day) => (
                    <FormField
                      key={day.id}
                      control={form.control}
                      name="availableDays"
                      render={({ field }) => (
                          <FormItem key={day.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), day.id])
                                    : field.onChange((field.value || []).filter((value) => value !== day.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{day.label}</FormLabel>
                          </FormItem>
                      )}
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
                  <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl>
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
                  <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl>
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
                     value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (hasExistingProfile ? <Edit className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />)}
            {hasExistingProfile ? "Update Profile" : "Save Profile"}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Profile {hasExistingProfile ? "Update" : "Creation"}</AlertDialogTitle>
            <AlertDialogDescription className="max-h-60 overflow-y-auto">
              Please review your information before saving:
              <ul className="mt-2 space-y-1 text-sm text-foreground list-disc list-inside">
                {confirmationSummary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActualSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    