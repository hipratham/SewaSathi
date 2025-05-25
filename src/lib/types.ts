
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
  amount?: number | null;        // Used for per-hour, per-job, fixed-project
  minAmount?: number | null;     // Used if type is 'varies'
  maxAmount?: number | null;     // Used if type is 'varies'
  details?: string | null;       // Used for 'free-consultation' description or optional notes for other types
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
  id: string; // This is often the Firebase Auth UID for providers
  name: string;
  category: ServiceCategory;
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
  overallRating: number; // Calculated average
  profileImage?: string;
  otherCategoryDescription?: string;
}

export type ServiceRequestStatus =
  | "pending_payment"          // Client submitted, waiting for initial fee
  | "pending_provider_action"  // Initial fee paid, provider needs to accept/reject
  | "pending_admin_fee"        // Provider accepted, waiting for provider to pay admin fee
  | "awaiting_admin_confirmation" // Provider paid admin fee, admin needs to confirm
  | "accepted_by_provider"     // Admin confirmed, client details shared with provider
  | "rejected_by_provider"
  | "in_progress"
  | "job_completed"            // Job done by provider, awaiting client confirmation/tip
  | "request_completed"        // Client confirmed job done, (optional tip paid)
  | "cancelled_by_client"
  | "cancelled_by_provider";


export interface ServiceRequest {
  id: string;
  userId: string; // Client's UID
  clientName: string;
  clientPhone: string;
  clientAddress: string; // Service location specified by client
  clientServiceNeeded: string; // Detailed description from client
  requestedAt: string; // ISO date string of initial request
  providerId?: string | null; // Assigned provider's UID
  serviceCategory?: ServiceCategory; // Category of service requested
  status: ServiceRequestStatus;
  paymentStatus?: "unpaid" | "paid_deposit" | "fully_paid"; // For client's payment to provider
  estimatedJobValueByProvider?: number | null; // Provider's quote
  adminFeeCalculated?: number | null; // 8% of estimatedJobValueByProvider
  adminFeePaid?: boolean;
  providerNotes?: string; // Notes from provider when accepting/rejecting
  tipAmount?: number | null;
}

// Add 'admin' to UserRole
export type UserRole = "seeker" | "provider" | "admin" | null;
