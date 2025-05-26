
import ProviderCard from "@/components/providers/provider-card";
import type { ServiceProvider } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search, WifiOff } from "lucide-react";
import GoogleAdPlaceholder from "@/components/ads/google-ad-placeholder";
import admin from "@/lib/firebase-admin"; // For server-side data fetching
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProvidersPageProps {
  searchParams: {
    service?: string;
    location?: string;
  };
}

async function getServiceProviders(): Promise<ServiceProvider[]> {
  try {
    const db = admin.database();
    const snapshot = await db.ref("providerProfiles").once("value");
    const providersData = snapshot.val();

    if (!providersData) {
      return [];
    }

    // Convert the object of providers into an array
    const providersArray = Object.keys(providersData).map((key) => ({
      id: key, // The key is the provider's UID
      ...providersData[key],
      // Ensure reviews and servicesOffered are arrays, default to empty if not present
      reviews: providersData[key].reviews || [],
      servicesOffered: providersData[key].servicesOffered || [],
      // Mock overallRating if not in DB for some reason, or calculate if reviews exist
      overallRating: providersData[key].overallRating !== undefined 
        ? providersData[key].overallRating 
        : (providersData[key].reviews && providersData[key].reviews.length > 0 
            ? parseFloat((providersData[key].reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / providersData[key].reviews.length).toFixed(1)) 
            : 0),
    }));
    return providersArray as ServiceProvider[];
  } catch (error) {
    console.error("Error fetching service providers:", error);
    return []; // Return empty array on error
  }
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { service, location } = searchParams;

  let allProviders = await getServiceProviders();
  let filteredProviders: ServiceProvider[] = allProviders;

  if (service) {
    filteredProviders = filteredProviders.filter(
      (p) => p.category.toLowerCase() === service.toLowerCase()
    );
  }
  if (location) {
    // This is a simple client-side filter on the already fetched data
    // A more robust location search would involve geo-queries or a search index
    filteredProviders = filteredProviders.filter((p) =>
      p.address.toLowerCase().includes(location.toLowerCase())
    );
  }

  const hasSearchParams = service || location;

  if (allProviders.length === 0 && !(await getServiceProviders().then(p => p.length > 0))) { // Check if fetch itself returned nothing
     return (
      <div className="space-y-8">
        <section className="p-6 bg-card rounded-lg shadow">
          <h1 className="text-3xl font-bold text-primary mb-2">Service Providers</h1>
          <p className="text-muted-foreground mb-6">
            Browse through our list of available service providers.
          </p>
        </section>
        <Alert variant="default" className="border-primary/30 bg-primary/5">
          <WifiOff className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">No Providers Available Yet</AlertTitle>
          <AlertDescription>
            It seems there are no service providers registered on the platform right now, or we couldn't fetch them. Please check back later or try refining your search.
          </AlertDescription>
        </Alert>
        <GoogleAdPlaceholder />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <section className="p-6 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {hasSearchParams && filteredProviders.length > 0 ? `Providers for "${service || ''}" in "${location || ''}"` : "All Service Providers"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {hasSearchParams && filteredProviders.length > 0
            ? `Found ${filteredProviders.length} provider(s) matching your criteria.`
            : `Browse all ${allProviders.length} available service provider(s).`}
        </p>
        {/* Basic filter/search bar (client-side refinement for now) */}
        {/* For actual dynamic search, this form should trigger a re-fetch or use client-side filtering more effectively */}
        <form action="/providers" method="GET">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="search" 
                name="service_query" // Using a different name to avoid conflict with service category filter
                defaultValue={searchParams?.service_query || ""}
                placeholder="Search providers by name or service..." 
                className="pl-10"
              />
            </div>
            <Input 
              type="search" 
              name="location_query" // Using a different name
              defaultValue={searchParams?.location_query || ""}
              placeholder="Filter by location..." 
              className="flex-grow sm:flex-grow-0 sm:w-auto"
            />
            <Button type="submit" variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </form>
      </section>
      
      {filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No providers found matching your current criteria.</p>
          <p className="mt-2">Try broadening your search or check back later.</p>
        </div>
      )}
      <GoogleAdPlaceholder />
    </div>
  );
}
