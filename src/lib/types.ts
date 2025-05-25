
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
    phone?: string;
    email?: string;
  };
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  rates: string; // e.g., "Rs. 500/hour", "Rs. 1000 per job"
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
