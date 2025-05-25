
import ProviderSearchForm from "@/components/providers/provider-search-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, UserPlus, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-16 md:py-20 bg-gradient-to-br from-primary/10 via-background to-background rounded-xl shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-6">
            Welcome to SewaSathi
          </h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8">
            Your trusted partner for finding reliable local service providers in Nepal.
            Get connected with skilled professionals for all your home and personal needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="text-lg py-7 px-8">
              <Link href="/providers">
                <Search className="mr-2 h-5 w-5" /> Find a Provider
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg py-7 px-8">
              <Link href="/auth/signup">
                <UserPlus className="mr-2 h-5 w-5" /> Join as Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <Card className="shadow-xl border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-primary">Find a Service Provider</CardTitle>
              <CardDescription className="text-md">Enter your details to find the help you need.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ProviderSearchForm />
            </CardContent>
          </Card>
        </div>
        <div className="order-1 md:order-2">
            <Image 
              src="https://placehold.co/800x600.png" 
              alt="Community services illustration"
              data-ai-hint="community services" 
              width={800} 
              height={600}
              className="rounded-xl shadow-2xl object-cover aspect-[4/3] transform hover:scale-105 transition-transform duration-300"
              priority 
            />
        </div>
      </div>

      <section className="py-16 bg-muted/50 rounded-xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">1. Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">Enter the service you need and your location to browse available professionals.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                  <UserPlus className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">2. Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">View detailed provider profiles, read reviews, compare rates, and select the best fit.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">3. Get It Done</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/70">Request service directly, coordinate, and get your job completed efficiently by trusted experts.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
