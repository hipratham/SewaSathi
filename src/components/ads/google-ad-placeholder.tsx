import { Card, CardContent } from "@/components/ui/card";
import { Announce } from "lucide-react"; // Using Announce as a generic ad icon

export default function GoogleAdPlaceholder() {
  return (
    <Card className="my-8 border-dashed border-primary/50 bg-primary/5">
      <CardContent className="p-6 text-center">
        <Announce className="mx-auto h-12 w-12 text-primary/70 mb-3" />
        <h3 className="text-lg font-semibold text-primary/90">Advertisement</h3>
        <p className="text-sm text-muted-foreground">
          This space is reserved for advertisements.
        </p>
      </CardContent>
    </Card>
  );
}
