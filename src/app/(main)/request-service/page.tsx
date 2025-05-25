"use client";
import ServiceRequestForm from "@/components/providers/service-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function RequestServicePage() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId") || undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-primary">Request a Service</CardTitle>
          <CardDescription>
            Fill out the form below to detail your needs. An initial fee of Rs. 100 is required to connect you with a provider. This fee will be collected via eSewa QR payment after you submit your request details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceRequestForm providerId={providerId} />
        </CardContent>
      </Card>
    </div>
  );
}
