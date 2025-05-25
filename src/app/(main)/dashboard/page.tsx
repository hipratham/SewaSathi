import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-primary">
            <LayoutDashboard className="mr-2 h-6 w-6" />
            User Dashboard
          </CardTitle>
          <CardDescription>
            Welcome to your SewaSathi dashboard. This area is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you will be able to manage your service requests, view your history, and update your profile.
          </p>
          <div className="mt-6 p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
            <p className="text-lg font-semibold text-muted-foreground">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">Exciting features are on their way.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
