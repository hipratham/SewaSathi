import type { ServiceProvider, Review, ServiceCategory } from "./types";

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


const mockProvidersData: Omit<ServiceProvider, 'overallRating' | 'reviews' | 'id'>[] = [
  {
    name: "Ramesh Plumbing Services",
    category: "plumber",
    servicesOffered: ["Leak Repair", "Pipe Installation", "Drain Cleaning"],
    contactInfo: { phone: "98XXXXXXXX", email: "ramesh.plumbing@example.com" },
    address: "Kupondole, Lalitpur",
    location: { lat: 27.6868, lng: 85.3187 },
    rates: "Rs. 800 per hour",
    availability: "Mon-Sat, 9 AM - 6 PM",
    profileImage: "https://placehold.co/300x300.png",
  },
  {
    name: "Sita's Electrical Works",
    category: "electrician",
    servicesOffered: ["Wiring", "Fixture Installation", "Appliance Repair"],
    contactInfo: { phone: "97XXXXXXXX", email: "sita.electrical@example.com" },
    address: "Baneshwor, Kathmandu",
    location: { lat: 27.7007, lng: 85.3301 },
    rates: "Rs. 1000 for initial visit, then Rs. 700/hr",
    availability: "Mon-Fri, 10 AM - 7 PM",
    profileImage: "https://placehold.co/300x300.png",
  },
  {
    name: "Hari Auto Repairs",
    category: "mechanic",
    servicesOffered: ["Bike Servicing", "Car Repair", "Tyre Change"],
    contactInfo: { phone: "96XXXXXXXX" },
    address: "Thapathali, Kathmandu",
    location: { lat: 27.6937, lng: 85.3180 },
    rates: "Varies by service",
    availability: "Everyday, 8 AM - 8 PM",
    profileImage: "https://placehold.co/300x300.png",
  },
  {
    name: "Gita Home Tutions",
    category: "tution-teacher",
    servicesOffered: ["Maths (Class 1-10)", "Science (Class 1-10)"],
    contactInfo: { email: "gita.tutions@example.com" },
    address: "Patan Durbar Square, Lalitpur",
    location: { lat: 27.6730, lng: 85.3240 },
    rates: "Rs. 5000 per subject per month",
    availability: "Weekends, Evenings (4 PM - 7 PM)",
    profileImage: "https://placehold.co/300x300.png",
  },
   {
    name: "CleanSweep Toilet Assistance",
    category: "toilet-helper",
    servicesOffered: ["Toilet cleaning", "Blockage removal", "Basic repairs"],
    contactInfo: { phone: "95XXXXXXX0" },
    address: "Asan, Kathmandu",
    rates: "Rs. 1200 per cleaning",
    availability: "Mon-Sun, 24/7 Emergency Available",
    profileImage: "https://placehold.co/300x300.png",
  },
];


export const mockServiceProviders: ServiceProvider[] = mockProvidersData.map(
  (provider, index) => {
    const reviews = generateReviews(provider.name);
    return {
      ...provider,
      id: `${provider.category}-${index + 1}`,
      reviews,
      overallRating: calculateOverallRating(reviews),
    };
  }
);
