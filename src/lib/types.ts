
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
  amount?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  details?: string | null;
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
  startTime?: string | null; // e.g., "09:00"
  endTime?: string | null;   // e.g., "17:00"
  notes?: string | null;    // e.g., "Weekends by appointment"
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  otherCategoryDescription?: string;
  servicesOffered: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  rates: ServiceProviderRates;
  availability: ServiceProviderAvailability;
  reviews: Review[];
  overallRating: number;
  profileImage?: string;
}

export type ServiceRequestStatus =
  | "pending_payment"
  | "pending_provider_action"
  | "pending_admin_fee"
  | "awaiting_admin_confirmation"
  | "accepted_by_provider"
  | "rejected_by_provider"
  | "admin_fee_payment_rejected"
  | "in_progress"
  | "job_completed"
  | "request_completed"
  | "cancelled_by_client"
  | "cancelled_by_provider";


export interface ServiceRequest {
  id: string;
  userId: string; 
  clientName: string;
  clientEmail?: string; // Added clientEmail
  clientPhone: string;
  clientAddress: string; 
  clientServiceNeeded: string; 
  requestedAt: string; 
  providerId?: string | null; 
  serviceCategory?: ServiceCategory; 
  status: ServiceRequestStatus;
  paymentStatus?: "unpaid" | "paid_deposit" | "fully_paid"; 
  estimatedJobValueByProvider?: number | null; 
  adminFeeCalculated?: number | null; 
  adminFeePaid?: boolean;
  adminRejectionReason?: string;
  providerNotes?: string; 
  tipAmount?: number | null;
}

export type UserRole = "seeker" | "provider" | "admin" | null;
