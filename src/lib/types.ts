
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
  // Old statuses (some might be deprecated or mapped)
  | "pending_payment" // May be deprecated by new flow
  | "pending_provider_action" // Could map to offer_sent_to_provider if seeker creates generic request
  | "pending_admin_fee" // Replaced by offer_accepted_by_provider_pending_payment
  | "awaiting_admin_confirmation" // Replaced by payment_submitted_pending_admin_approval
  | "accepted_by_provider" // Replaced by admin_approved_contact_unlocked
  | "rejected_by_provider" // Replaced by offer_declined_by_provider
  | "admin_fee_payment_rejected" // Replaced by admin_rejected_payment
  | "in_progress"
  | "job_completed"
  | "request_completed" // Can be same as job_completed or a final closing status
  | "cancelled_by_client"
  | "cancelled_by_provider"
  // New statuses for Offer Workflow
  | "offer_sent_to_provider"       // Seeker sends offer
  | "offer_declined_by_provider"   // Provider declines
  | "offer_accepted_by_provider_pending_payment" // Provider accepts, awaiting their commission payment
  | "payment_submitted_pending_admin_approval"   // Provider claims they paid commission
  | "admin_approved_contact_unlocked"            // Admin confirms payment, seeker details shared
  | "admin_rejected_payment";      // Admin rejects payment

export const COMMISSION_RATE = 0.08;

export interface ServiceRequest { // Represents an "Offer" or "Service Request"
  id: string;
  userId: string; // Seeker's ID
  clientName: string; // Seeker's Name
  clientEmail?: string;
  clientPhone: string;
  clientAddress: string;
  taskDetails: string; // Replaces clientServiceNeeded for offers
  requestedAt: string;
  providerId: string | null; // Provider's ID this offer is for
  serviceCategory?: ServiceCategory; // Relevant if it's a general request, or for context

  budget?: number | null; // Proposed by seeker or agreed upon
  preferredDate?: string | null; // Proposed by seeker

  status: ServiceRequestStatus;

  // Provider related fields from old flow - might be set by provider if it was a generic request first
  estimatedJobValueByProvider?: number | null; // Could be used if provider counters budget

  // Commission and payment tracking for the new offer flow
  commissionAmount?: number | null; // Calculated: budget * COMMISSION_RATE
  paymentReference?: string | null; // Simulated eSewa ref from provider
  adminFeePaid?: boolean; // True if admin approves payment

  // Rejection reasons
  providerRejectionReason?: string | null; // If provider declines offer
  adminRejectionReason?: string | null; // If admin rejects provider's payment

  // Other fields
  providerNotes?: string | null;
  tipAmount?: number | null;
}

export type UserRole = "seeker" | "provider" | "admin" | null;
