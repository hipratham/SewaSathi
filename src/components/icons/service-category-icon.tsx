
import type { ServiceCategory } from "@/lib/types";
import {
  Wrench,
  ShowerHead,
  PlugZap,
  BookOpenText,
  Settings2,
  SprayCan,
  PaintRoller,
  ChefHat,
  Camera,
  Hammer,
  Scissors,
  Baby,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

interface ServiceCategoryIconProps extends LucideProps {
  category: ServiceCategory;
}

export default function ServiceCategoryIcon({ category, ...props }: ServiceCategoryIconProps) {
  switch (category) {
    case "electrician":
      return <PlugZap {...props} />;
    case "plumber":
      return <ShowerHead {...props} />;
    case "house-cleaning":
      return <SprayCan {...props} />;
    case "painter":
      return <PaintRoller {...props} />;
    case "appliance-repair":
      return <Wrench {...props} />;
    case "cook":
      return <ChefHat {...props} />;
    case "cctv-installer":
      return <Camera {...props} />;
    case "carpenter":
      return <Hammer {...props} />;
    case "beautician":
      return <Scissors {...props} />;
    case "babysitter":
      return <Baby {...props} />;
    case "tuition-teacher":
      return <BookOpenText {...props} />;
    case "other":
      return <Settings2 {...props} />;
    default:
      // Fallback for any unhandled or new categories during development
      const exhaustiveCheck: never = category;
      return <Settings2 {...props} />;
  }
}
