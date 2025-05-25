import ProviderProfileForm from "@/components/providers/provider-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProviderSetupPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary">Join SewaSathi as a Provider</CardTitle>
          <CardDescription>
            Create or update your profile to offer your services to the community.
            Fill in the details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
