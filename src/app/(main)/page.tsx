import ProviderSearchForm from "@/components/providers/provider-search-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-background rounded-lg shadow-sm">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
          Welcome to SewaSathi
        </h1>
        <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          Your trusted partner for finding reliable local service providers in Nepal.
          Get connected with skilled professionals for all your home and personal needs.
        </p>
      </section>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Find a Service Provider</CardTitle>
              <CardDescription>Enter your details to find the help you need.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderSearchForm />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Image 
              src="https://placehold.co/800x600.png" 
              alt="Community services illustration"
              data-ai-hint="community services" 
              width={800} 
              height={600}
              className="rounded-lg shadow-lg object-cover aspect-[4/3]"
            />
        </div>
      </div>

      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card>
            <CardHeader>
              <CardTitle>1. Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Enter the service you need and your location.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Browse provider profiles, reviews, and rates.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Get It Done</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Request service and get your job completed by professionals.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
