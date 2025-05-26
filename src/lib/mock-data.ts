
import type { ServiceProvider, Review, ServiceProviderAvailability, ServiceProviderRates, ServiceRequest, ServiceCategory, ServiceRequestStatus } from "./types";
import { COMMISSION_RATE } from "./types";

const generateReviews = (providerName: string): Review[] => [
  {
    id: `${providerName.toLowerCase().replace(/\s+/g, "-")}-review-1`,
    userId: "user123",
    userName: "Aarav Sharma",
    rating: 5,
    comment: `Excellent service from ${providerName}! Very punctual and skilled. Fixed my issue quickly.`,
    createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  },
  {
    id: `${providerName.toLowerCase().replace(/\s+/g, "-")}-review-2`,
    userId: "user456",
    userName: "Priya Koirala",
    rating: 4,
    comment: `${providerName} was quite good. A bit late, but did a thorough job.`,
    createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  },
  {
    id: `${providerName.toLowerCase().replace(/\s+/g, "-")}-review-3`,
    userId: "user789",
    userName: "Rohan Adhikari",
    rating: 5,
    comment: `Highly recommend ${providerName}. Professional and reliable.`,
    createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
  },
];

const calculateOverallRating = (reviews: Review[]): number => {
  if (!reviews || reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return parseFloat((totalRating / reviews.length).toFixed(1));
};

interface RawProviderData {
  id: string;
  name: string;
  category: ServiceProvider['category'];
  otherCategoryDescription?: string;
  servicesOfferedArray: string[];
  contactInfo: { phone: string; email: string };
  address: string;
  location?: ServiceProvider['location'];
  ratesObject: ServiceProviderRates;
  availabilityString: string; 
  availability?: ServiceProviderAvailability; 
  profileImage?: string;
}


const mockProvidersRawData: RawProviderData[] = [
  {
    id: "mock-provider-uid-1",
    name: "Ramesh Plumbing Services",
    category: "plumber",
    servicesOfferedArray: ["Leak Repair", "Pipe Installation", "Drain Cleaning"],
    contactInfo: { phone: "9800000001", email: "ramesh.plumbing@example.com" },
    address: "Kupondole, Lalitpur",
    location: { lat: 27.6868, lng: 85.3187 },
    ratesObject: { type: "per-hour", amount: 800, details: "Minimum 1 hour charge." },
    availabilityString: "Mon-Sat, 9 AM - 6 PM",
    profileImage: "https://placehold.co/300x300.png?text=RP",
  },
  {
    id: "mock-provider-uid-2",
    name: "Sita's Electrical Works",
    category: "electrician",
    servicesOfferedArray: ["Wiring", "Fixture Installation", "Emergency Repairs"],
    contactInfo: { phone: "9800000002", email: "sita.electrical@example.com" },
    address: "Baneshwor, Kathmandu",
    location: { lat: 27.7007, lng: 85.3301 },
    ratesObject: { type: "per-job", amount: 1000, details: "Initial visit & diagnosis. Hourly rate applies for extended work." },
    availabilityString: "Mon-Fri, 10 AM - 7 PM",
    profileImage: "https://placehold.co/300x300.png?text=SE",
  },
  {
    id: "mock-provider-uid-3",
    name: "Hari Appliance Repairs",
    category: "appliance-repair",
    servicesOfferedArray: ["AC Repair", "Fridge Servicing", "Washing Machine Fix"],
    contactInfo: { phone: "9800000003", email: "hari.appliance@example.com" },
    address: "Thapathali, Kathmandu",
    location: { lat: 27.6937, lng: 85.3180 },
    ratesObject: { type: "varies", minAmount: 500, maxAmount: 2500, details: "Inspection fee Rs. 300, waived if service availed." },
    availabilityString: "Everyday, 8 AM - 8 PM",
    profileImage: "https://placehold.co/300x300.png?text=HA",
  },
  {
    id: "mock-provider-uid-4",
    name: "Gita Home Tutions",
    category: "tuition-teacher",
    servicesOfferedArray: ["Maths (Class 1-10)", "Science (Class 1-10)", "English Language"],
    contactInfo: { phone: "9800000004", email: "gita.tutions@example.com" },
    address: "Patan Durbar Square, Lalitpur",
    location: { lat: 27.6730, lng: 85.3240 },
    ratesObject: { type: "fixed-project", amount: 5000, details: "Per subject, per month. Group discounts available." },
    availabilityString: "Weekends, Evenings (4 PM - 7 PM)",
    profileImage: "https://placehold.co/300x300.png?text=GT",
  },
   {
    id: "mock-provider-uid-5",
    name: "CleanSweep Home Services",
    category: "house-cleaning",
    servicesOfferedArray: ["General house cleaning", "Deep cleaning", "Office cleaning"],
    contactInfo: { phone: "9800000005", email: "cleansweep@example.com" },
    address: "Asan, Kathmandu",
    ratesObject: { type: "per-job", amount: 1200, details: "For standard 2BHK. Additional charges for larger areas or deep cleaning." },
    availabilityString: "Mon-Sun, 9 AM - 5 PM",
    profileImage: "https://placehold.co/300x300.png?text=CS",
  },
  {
    id: "mock-provider-uid-6",
    name: "Creative Wall Painters",
    category: "painter",
    servicesOfferedArray: ["Interior Painting", "Exterior Painting", "Wall Texturing"],
    contactInfo: { phone: "9800000006", email: "creativewalls@example.com" },
    address: "Jawalakhel, Lalitpur",
    ratesObject: { type: "free-consultation", details: "Free on-site inspection and detailed quotation provided for all painting projects. No obligation." },
    availabilityString: "Mon-Sat, 10 AM - 5 PM",
    profileImage: "https://placehold.co/300x300.png?text=WP",
  },
];

const parseAvailabilityString = (availabilityString: string): ServiceProviderAvailability => {
    const availability: ServiceProviderAvailability = { days: [] };
    const lowerStr = availabilityString.toLowerCase();
    const dayMap: { [key: string]: string } = {
        "mon": "Mon", "monday": "Mon", "tue": "Tue", "tuesday": "Tue",
        "wed": "Wed", "wednesday": "Wed", "thu": "Thu", "thursday": "Thu",
        "fri": "Fri", "friday": "Fri", "sat": "Sat", "saturday": "Sat",
        "sun": "Sun", "sunday": "Sun",
    };
    const daysFound = new Set<string>();
    if (lowerStr.includes("mon-fri")) ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach(d => daysFound.add(d));
    if (lowerStr.includes("mon-sat")) ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => daysFound.add(d));
    if (lowerStr.includes("everyday") || lowerStr.includes("mon-sun")) ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => daysFound.add(d));
    Object.keys(dayMap).forEach(key => {
        if (lowerStr.includes(key) && !daysFound.has(dayMap[key])) daysFound.add(dayMap[key]);
    });
    if (lowerStr.includes("weekend")) { daysFound.add("Sat"); daysFound.add("Sun"); }
    availability.days = Array.from(daysFound);
    if(availability.days.length === 0 && !lowerStr.includes("appointment")) availability.days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    
    const timeRegex = /(\d{1,2})\s*(am|pm)?\s*-\s*(\d{1,2})\s*(am|pm)?/i; 
    const timeMatch = availabilityString.match(timeRegex);
    if (timeMatch) {
        let startHour = parseInt(timeMatch[1]); const startPeriod = timeMatch[2]?.toLowerCase();
        let endHour = parseInt(timeMatch[3]); const endPeriod = timeMatch[4]?.toLowerCase();
        if (startPeriod === "pm" && startHour < 12) startHour += 12;
        if (startPeriod === "am" && startHour === 12) startHour = 0; 
        if (endPeriod === "pm" && endHour < 12) endHour += 12;
        if (endPeriod === "am" && endHour === 12) endHour = 0; 
        availability.startTime = `${String(startHour).padStart(2, '0')}:00`;
        availability.endTime = `${String(endHour).padStart(2, '0')}:00`;
    } else {
        if (lowerStr.includes("morning") || lowerStr.includes("9 am")) availability.startTime = "09:00";
        if (lowerStr.includes("afternoon") || lowerStr.includes("1 pm")) availability.startTime = "13:00";
        if (lowerStr.includes("evening")) availability.endTime = "17:00"; 
        if (lowerStr.includes("4 pm")) availability.startTime = "16:00";
        if (lowerStr.includes("7 pm")) availability.endTime = "19:00";
    }

    if (!availability.startTime && !availability.endTime && lowerStr.includes("flexible")) {
      availability.notes = (availability.notes ? availability.notes + "; " : "") + "Flexible hours";
    }
    if(lowerStr.includes("by appointment")) availability.notes = (availability.notes ? availability.notes + "; " : "") + "By appointment only";
    if(lowerStr.includes("24/7")) {
        availability.days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        availability.startTime = "00:00"; availability.endTime = "23:59";
        availability.notes = (availability.notes ? availability.notes + "; " : "") + "24/7 Emergency Available";
    }
    return availability;
};

export const mockServiceProviders: ServiceProvider[] = mockProvidersRawData.map(
  (providerData) => {
    const reviews = generateReviews(providerData.name);
    return {
      id: providerData.id,
      name: providerData.name,
      category: providerData.category,
      otherCategoryDescription: providerData.otherCategoryDescription,
      servicesOffered: providerData.servicesOfferedArray,
      contactInfo: providerData.contactInfo,
      address: providerData.address,
      location: providerData.location,
      rates: providerData.ratesObject,
      overallRating: calculateOverallRating(reviews),
      reviews,
      availability: providerData.availability || parseAvailabilityString(providerData.availabilityString),
      profileImage: providerData.profileImage,
    };
  }
);


export const mockServiceRequests: ServiceRequest[] = [
  {
    id: "offer-001",
    userId: "seeker-uid-1", // Seeker
    clientName: "Aasha Thapa",
    clientEmail: "aasha.thapa@example.com",
    clientPhone: "9812345670",
    clientAddress: "Lazimpat, Kathmandu",
    taskDetails: "My kitchen sink is clogged and water is backing up. Need urgent help.",
    budget: 1000,
    preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-1", // Ramesh Plumbing Services
    serviceCategory: "plumber",
    status: "offer_sent_to_provider" as ServiceRequestStatus,
  },
  {
    id: "offer-002",
    userId: "seeker-uid-2",
    clientName: "Bikram Rai",
    clientEmail: "bikram.rai@example.com",
    clientPhone: "9809876543",
    clientAddress: "Sanepa, Lalitpur",
    taskDetails: "Need to install new ceiling fans in two rooms and fix a faulty light switch.",
    budget: 2500,
    preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requestedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-2", // Sita's Electrical Works
    serviceCategory: "electrician",
    status: "offer_accepted_by_provider_pending_payment" as ServiceRequestStatus,
    commissionAmount: 2500 * COMMISSION_RATE,
  },
  {
    id: "offer-003",
    userId: "seeker-uid-3",
    clientName: "Sunita Gurung",
    clientEmail: "sunita.gurung@example.com",
    clientPhone: "9855555555",
    clientAddress: "Koteshwor, Kathmandu",
    taskDetails: "Washing machine is not spinning. Makes a loud noise.",
    budget: 1200,
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-3", // Hari Appliance Repairs
    serviceCategory: "appliance-repair",
    status: "payment_submitted_pending_admin_approval" as ServiceRequestStatus,
    commissionAmount: 1200 * COMMISSION_RATE,
    paymentReference: "ESW-PAY-XYZ123",
  },
  {
    id: "offer-004",
    userId: "seeker-uid-4",
    clientName: "Rajesh Shrestha",
    clientEmail: "rajesh.shrestha@example.com",
    clientPhone: "9841122333",
    clientAddress: "Old Baneshwor, Kathmandu",
    taskDetails: "Looking for a math tutor for my son in Class 8, CBSE board. Preferably 3 days a week.",
    budget: 4500, // Monthly
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-4", // Gita Home Tutions
    serviceCategory: "tuition-teacher",
    status: "admin_approved_contact_unlocked" as ServiceRequestStatus, 
    commissionAmount: 4500 * COMMISSION_RATE,
    adminFeePaid: true,
  },
  {
    id: "offer-005",
    userId: "seeker-uid-1", // Aasha Thapa again
    clientName: "Aasha Thapa",
    clientEmail: "aasha.thapa@example.com",
    clientPhone: "9812345670",
    clientAddress: "Lazimpat, Kathmandu",
    taskDetails: "Need urgent AC repair, not cooling.",
    budget: 1800,
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-3", // Hari Appliance Repairs
    serviceCategory: "appliance-repair",
    status: "offer_declined_by_provider" as ServiceRequestStatus,
    providerRejectionReason: "Currently overbooked with AC repairs for the next few days.",
  },
   {
    id: "offer-006",
    userId: "seeker-uid-6",
    clientName: "Nabin Karki",
    clientEmail: "nabin.karki@example.com",
    clientPhone: "9801234567",
    clientAddress: "Budhanilkantha, Kathmandu",
    taskDetails: "The main circuit breaker keeps tripping. Need an electrician to diagnose and fix.",
    budget: 1500,
    requestedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-2", // Sita's Electrical Works
    serviceCategory: "electrician",
    status: "payment_submitted_pending_admin_approval" as ServiceRequestStatus, 
    commissionAmount: 1500 * COMMISSION_RATE,
    paymentReference: "ESW-PAY-ABC789"
  },
  {
    id: "offer-007",
    userId: "seeker-uid-7",
    clientName: "Anita Maharjan",
    clientEmail: "anita.maharjan@example.com",
    clientPhone: "9807654321",
    clientAddress: "Boudha, Kathmandu",
    taskDetails: "My AC is not cooling properly. Might need a gas refill or servicing.",
    budget: 2000,
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
    providerId: "mock-provider-uid-3", // Hari Appliance Repairs
    serviceCategory: "appliance-repair",
    status: "admin_rejected_payment" as ServiceRequestStatus, 
    commissionAmount: 2000 * COMMISSION_RATE,
    paymentReference: "ESW-PAY-FAIL01",
    adminRejectionReason: "Payment screenshot unclear or amount mismatch.",
  },
  {
    id: "offer-008", // For provider-uid-1 (Ramesh Plumbing)
    userId: "seeker-uid-8",
    clientName: "Prakash Yadav",
    clientEmail: "prakash.yadav@example.com",
    clientPhone: "9811112222",
    clientAddress: "Chabahil, Kathmandu",
    taskDetails: "Leaky faucet in the bathroom, needs repair or replacement.",
    budget: 700,
    preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    providerId: "mock-provider-uid-1", // Ramesh Plumbing Services
    serviceCategory: "plumber",
    status: "offer_sent_to_provider" as ServiceRequestStatus,
  },
  {
    id: "offer-009", // Completed job for provider-uid-1
    userId: "seeker-uid-9",
    clientName: "Kiran Basnet",
    clientEmail: "kiran.basnet@example.com",
    clientPhone: "9800011122",
    clientAddress: "Baluwatar, Kathmandu",
    taskDetails: "Fixed a major pipe burst. Excellent and quick work!",
    budget: 3000,
    requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    providerId: "mock-provider-uid-1", // Ramesh Plumbing Services
    serviceCategory: "plumber",
    status: "job_completed" as ServiceRequestStatus,
    commissionAmount: 3000 * COMMISSION_RATE,
    adminFeePaid: true,
  },
  {
    id: "offer-010", // Another offer for provider-uid-1 to accept or decline
    userId: "seeker-uid-10",
    clientName: "Sarita Joshi",
    clientEmail: "sarita.joshi@example.com",
    clientPhone: "9822233344",
    clientAddress: "Pulchowk, Lalitpur",
    taskDetails: "Need to install a new water heater.",
    budget: 1800,
    preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requestedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    providerId: "mock-provider-uid-1", // Ramesh Plumbing Services
    serviceCategory: "plumber",
    status: "offer_sent_to_provider" as ServiceRequestStatus,
  },
];
