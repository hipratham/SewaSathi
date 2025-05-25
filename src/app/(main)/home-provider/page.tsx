
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Edit3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeProviderPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome, Service Provider!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Manage your services and connect with clients through SewaSathi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-foreground/80">
            You're ready to offer your expertise. Here’s how you can get started:
          </p>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
             <Link href="/provider-setup" passHref>
               <Button size="lg" className="w-full py-8 text-lg">
                <Edit3 className="mr-3 h-6 w-6" /> Manage Your Profile
              </Button>
            </Link>
            <Link href="/dashboard" passHref> {/* Placeholder, provider dashboard might show requests */}
              <Button size="lg" variant="outline" className="w-full py-8 text-lg">
                <Briefcase className="mr-3 h-6 w-6" /> View Service Requests
              </Button>
            </Link>
          </div>
           <div className="mt-8 p-6 border-2 border-dashed border-primary/30 rounded-lg text-center bg-primary/5">
            <Users className="mx-auto h-10 w-10 text-primary mb-3" />
            <h3 className="text-xl font-semibold text-primary">Connect with Clients</h3>
            <p className="text-muted-foreground mt-1">
              Keep your profile updated to attract more customers. Ensure your availability and rates are current.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
