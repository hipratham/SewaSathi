
export type ServiceCategory =
  | "electrician"
  | "plumber"
  | "house-cleaning"
  | "painter"
  | "appliance-repair"
  | "cook"
  | "cctv-installer"
  | "carpenter"
  | "beautician"
  | "babysitter"
  | "tuition-teacher"
  | "other";

export const serviceCategories: { value: ServiceCategory; label: string }[] = [
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "house-cleaning", label: "House Cleaning / Maid Services" },
  { value: "painter", label: "Painter / Wall Repair" },
  { value: "appliance-repair", label: "AC / Fridge / Washing Machine Repair" },
  { value: "cook", label: "Cook / Home Chef" },
  { value: "cctv-installer", label: "CCTV / Security System Installer" },
  { value: "carpenter", label: "Carpenter / Furniture Repair" },
  { value: "beautician", label: "Home-Based Beautician / Salon Services" },
  { value: "babysitter", label: "Babysitter / Nanny Services" },
  { value: "tuition-teacher", label: "Tuition Teacher / Home Tutor" },
  { value: "other", label: "Other" },
];

export type RateType = "per-hour" | "per-job" | "fixed-project" | "varies" | "free-consultation";

export const rateTypeOptions: { value: RateType; label: string }[] = [
  { value: "per-hour", label: "Per Hour" },
  { value: "per-job", label: "Per Job (approximate)" },
  { value: "fixed-project", label: "Fixed Project Price" },
  { value: "varies", label: "Varies (specify range)" },
  { value: "free-consultation", label: "Offers Free Consultation" },
];

export interface ServiceProviderRates {
  type: RateType;
  amount?: number;        // Used for per-hour, per-job, fixed-project
  minAmount?: number;     // Used if type is 'varies'
  maxAmount?: number;     // Used if type is 'varies'
  details?: string;       // Used for 'free-consultation' description or optional notes for other types
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO date string
}

export interface ServiceProviderAvailability {
  days: string[]; // e.g., ["Mon", "Tue", "Wed"]
  startTime?: string; // e.g., "09:00"
  endTime?: string;   // e.g., "17:00"
  notes?: string;    // e.g., "Weekends by appointment"
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  servicesOffered: string[]; 
  contactInfo: {
    phone: string; // Made mandatory
    email: string; // Made mandatory
  };
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  rates: ServiceProviderRates; 
  availability: ServiceProviderAvailability;
  reviews: Review[];
  overallRating: number; // Calculated average
  profileImage?: string;
  otherCategoryDescription?: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  userName:string;
  userPhone: string;
  providerId?: string; // Assigned provider
  serviceNeeded: string;
  location: string;
  status: "pending_payment" | "pending_acceptance" | "accepted" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid_deposit" | "fully_paid";
  requestedAt: string; // ISO date string
  tipAmount?: number;
}
