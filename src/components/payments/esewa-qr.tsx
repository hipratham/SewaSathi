import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EsewaQrProps {
  amount: number;
  description?: string;
}

export default function EsewaQrCode({ amount, description = "Service Request Fee" }: EsewaQrProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-primary">eSewa Payment</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center space-y-3">
        <Image
          src="https://placehold.co/250x250.png?text=eSewa+QR" // Replace with actual eSewa QR or generation logic
          alt="eSewa QR Code"
          width={200}
          height={200}
          className="rounded-md border"
          data-ai-hint="QR code payment"
        />
        <p className="font-semibold text-lg">Scan to Pay: Rs. {amount}</p>
        <p className="text-sm text-muted-foreground">
          Please scan the QR code using your eSewa app to complete the payment.
          After payment, your request will be processed.
        </p>
      </CardContent>
    </Card>
  );
}
