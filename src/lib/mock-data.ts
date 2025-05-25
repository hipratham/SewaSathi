
import type { ServiceProvider, Review, ServiceCategory, ServiceProviderAvailability } from "./types";

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


const mockProvidersData: Omit<ServiceProvider, 'overallRating' | 'reviews' | 'id' | 'availability'> & { availabilityString: string }[] = [
  {
    name: "Ramesh Plumbing Services",
    category: "plumber",
    servicesOffered: ["Leak Repair", "Pipe Installation", "Drain Cleaning"],
    contactInfo: { phone: "98XXXXXXXX", email: "ramesh.plumbing@example.com" },
    address: "Kupondole, Lalitpur",
    location: { lat: 27.6868, lng: 85.3187 },
    rates: "Rs. 800 per hour",
    availabilityString: "Mon-Sat, 9 AM - 6 PM",
    profileImage: "https://placehold.co/300x300.png?text=RP",
  },
  {
    name: "Sita's Electrical Works",
    category: "electrician",
    servicesOffered: ["Wiring", "Fixture Installation", "Appliance Repair"],
    contactInfo: { phone: "97XXXXXXXX", email: "sita.electrical@example.com" },
    address: "Baneshwor, Kathmandu",
    location: { lat: 27.7007, lng: 85.3301 },
    rates: "Rs. 1000 for initial visit, then Rs. 700/hr",
    availabilityString: "Mon-Fri, 10 AM - 7 PM",
    profileImage: "https://placehold.co/300x300.png?text=SE",
  },
  {
    name: "Hari Appliance Repairs", // Changed from Auto Repairs
    category: "appliance-repair", // Changed category
    servicesOffered: ["AC Repair", "Fridge Servicing", "Washing Machine Fix"],
    contactInfo: { phone: "96XXXXXXXX" },
    address: "Thapathali, Kathmandu",
    location: { lat: 27.6937, lng: 85.3180 },
    rates: "Varies by service",
    availabilityString: "Everyday, 8 AM - 8 PM",
    profileImage: "https://placehold.co/300x300.png?text=HA",
  },
  {
    name: "Gita Home Tutions",
    category: "tuition-teacher",
    servicesOffered: ["Maths (Class 1-10)", "Science (Class 1-10)"],
    contactInfo: { email: "gita.tutions@example.com" },
    address: "Patan Durbar Square, Lalitpur",
    location: { lat: 27.6730, lng: 85.3240 },
    rates: "Rs. 5000 per subject per month",
    availabilityString: "Weekends, Evenings (4 PM - 7 PM)",
    profileImage: "https://placehold.co/300x300.png?text=GT",
  },
   {
    name: "CleanSweep Home Services", // Changed from Toilet Assistance
    category: "house-cleaning", // Changed category
    servicesOffered: ["General house cleaning", "Deep cleaning", "Maid services"],
    contactInfo: { phone: "95XXXXXXX0" },
    address: "Asan, Kathmandu",
    rates: "Rs. 1200 per cleaning session",
    availabilityString: "Mon-Sun, 9 AM - 5 PM",
    profileImage: "https://placehold.co/300x300.png?text=CS",
  },
];

const parseAvailabilityString = (availabilityString: string): ServiceProviderAvailability => {
    const availability: ServiceProviderAvailability = { days: [] };
    const lowerStr = availabilityString.toLowerCase();

    const dayMap: { [key: string]: string } = {
        "mon": "Mon", "monday": "Mon",
        "tue": "Tue", "tuesday": "Tue",
        "wed": "Wed", "wednesday": "Wed",
        "thu": "Thu", "thursday": "Thu",
        "fri": "Fri", "friday": "Fri",
        "sat": "Sat", "saturday": "Sat",
        "sun": "Sun", "sunday": "Sun",
    };

    const daysFound = new Set<string>();

    if (lowerStr.includes("mon-fri")) ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach(d => daysFound.add(d));
    if (lowerStr.includes("mon-sat")) ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(d => daysFound.add(d));
    if (lowerStr.includes("everyday") || lowerStr.includes("mon-sun")) ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => daysFound.add(d));
    
    Object.keys(dayMap).forEach(key => {
        if (lowerStr.includes(key) && !daysFound.has(dayMap[key])) {
            daysFound.add(dayMap[key]);
        }
    });
    if (lowerStr.includes("weekend")) { daysFound.add("Sat"); daysFound.add("Sun"); }

    availability.days = Array.from(daysFound);
    if(availability.days.length === 0) availability.days = ["Mon", "Tue", "Wed", "Thu", "Fri"]; // Default if no days parsed

    const timeRegex = /(\d{1,2})\s*(am|pm)?\s*-\s*(\d{1,2})\s*(am|pm)?/;
    const timeMatch = availabilityString.match(timeRegex);

    if (timeMatch) {
        let startHour = parseInt(timeMatch[1]);
        const startPeriod = timeMatch[2];
        let endHour = parseInt(timeMatch[3]);
        const endPeriod = timeMatch[4];

        if (startPeriod === "pm" && startHour < 12) startHour += 12;
        if (startPeriod === "am" && startHour === 12) startHour = 0; // Midnight
        if (endPeriod === "pm" && endHour < 12) endHour += 12;
        if (endPeriod === "am" && endHour === 12) endHour = 0; // Midnight, assuming next day if range implies it

        availability.startTime = `${String(startHour).padStart(2, '0')}:00`;
        availability.endTime = `${String(endHour).padStart(2, '0')}:00`;
    } else {
        // Fallback if regex fails or only one time mentioned
        if (lowerStr.includes("morning") || lowerStr.includes("9 am")) availability.startTime = "09:00";
        if (lowerStr.includes("evening") || lowerStr.includes("5 pm")) availability.endTime = "17:00";
        if (lowerStr.includes("4 pm")) availability.startTime = "16:00";
        if (lowerStr.includes("7 pm")) availability.endTime = "19:00";
    }
    
    // Simple notes parsing
    if(lowerStr.includes("by appointment")) availability.notes = "By appointment only";
    if(lowerStr.includes("24/7")) {
        availability.days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        availability.startTime = "00:00";
        availability.endTime = "23:59";
        availability.notes = "24/7 Emergency Available";
    }


    return availability;
};


export const mockServiceProviders: ServiceProvider[] = mockProvidersData.map(
  (providerData, index) => {
    const reviews = generateReviews(providerData.name);
    return {
      ...providerData,
      id: `${providerData.category}-${index + 1}`,
      reviews,
      overallRating: calculateOverallRating(reviews),
      availability: parseAvailabilityString(providerData.availabilityString),
    };
  }
);
