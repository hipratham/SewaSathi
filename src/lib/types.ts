export type ServiceCategory =
  | "mechanic"
  | "plumber"
  | "electrician"
  | "toilet-helper"
  | "tution-teacher"
  | "other";

export const serviceCategories: { value: ServiceCategory; label: string }[] = [
  { value: "mechanic", label: "Mechanic" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "toilet-helper", label: "Toilet Helper" },
  { value: "tution-teacher", label: "Tution Teacher" },
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
  availability: string; // e.g., "Mon-Fri 9am-5pm"
  reviews: Review[];
  overallRating: number; // Calculated average
  profileImage?: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  userName: string;
  providerId?: string; // Assigned provider
  serviceNeeded: string;
  location: string;
  status: "pending_payment" | "pending_acceptance" | "accepted" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid_deposit" | "fully_paid";
  requestedAt: string; // ISO date string
  tipAmount?: number;
}
