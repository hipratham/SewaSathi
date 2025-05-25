import ProviderCard from "@/components/providers/provider-card";
import { mockServiceProviders } from "@/lib/mock-data";
import type { ServiceProvider } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import GoogleAdPlaceholder from "@/components/ads/google-ad-placeholder";

interface ProvidersPageProps {
  searchParams: {
    service?: string;
    location?: string;
  };
}

// This is a server component, so direct filtering can be done here.
// For client-side filtering, you'd use useState and useEffect.
export default function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { service, location } = searchParams;

  let filteredProviders: ServiceProvider[] = mockServiceProviders;

  if (service) {
    filteredProviders = filteredProviders.filter(
      (p) => p.category.toLowerCase() === service.toLowerCase()
    );
  }
  if (location) {
    filteredProviders = filteredProviders.filter((p) =>
      p.address.toLowerCase().includes(location.toLowerCase())
    );
  }

  const hasSearchParams = service || location;

  return (
    <div className="space-y-8">
      <section className="p-6 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-primary mb-2">
          {hasSearchParams ? `Providers for "${service || ''}" in "${location || ''}"` : "All Service Providers"}
        </h1>
        <p className="text-muted-foreground mb-6">
          {hasSearchParams 
            ? `Found ${filteredProviders.length} provider(s) matching your criteria.`
            : "Browse through our list of available service providers."}
        </p>
        {/* Basic filter/search bar for client-side refinement (can be enhanced) */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search providers by name or service..." className="pl-10"/>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </section>
      
      {filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No providers found matching your criteria.</p>
          <p className="mt-2">Try broadening your search or check back later.</p>
        </div>
      )}
      <GoogleAdPlaceholder />
    </div>
  );
}
