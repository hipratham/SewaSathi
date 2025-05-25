
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ListChecks, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeSeekerPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome, Service Seeker!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Find the help you need quickly and easily with SewaSathi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-foreground/80">
            You're all set to start searching for reliable local service providers.
            What would you like to do today?
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <Link href="/providers" passHref>
              <Button size="lg" className="w-full py-8 text-lg">
                <Search className="mr-3 h-6 w-6" /> Find a Provider
              </Button>
            </Link>
            <Link href="/request-service" passHref>
              <Button size="lg" variant="outline" className="w-full py-8 text-lg">
                <ListChecks className="mr-3 h-6 w-6" /> Create a New Service Request
              </Button>
            </Link>
          </div>
           <div className="mt-8 p-6 border-2 border-dashed border-primary/30 rounded-lg text-center bg-primary/5">
            <UserCheck className="mx-auto h-10 w-10 text-primary mb-3" />
            <h3 className="text-xl font-semibold text-primary">Your Dashboard</h3>
            <p className="text-muted-foreground mt-1 mb-3">
              Manage your requests and view your history.
            </p>
            <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
