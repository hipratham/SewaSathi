import type { ServiceCategory } from "@/lib/types";
import { Wrench, ShowerHead, PlugZap, HandHelping, BookOpenText, Settings2 } from "lucide-react";
import type { LucideProps } from "lucide-react";

interface ServiceCategoryIconProps extends LucideProps {
  category: ServiceCategory;
}

export default function ServiceCategoryIcon({ category, ...props }: ServiceCategoryIconProps) {
  switch (category) {
    case "mechanic":
      return <Wrench {...props} />;
    case "plumber":
      return <ShowerHead {...props} />;
    case "electrician":
      return <PlugZap {...props} />;
    case "toilet-helper":
      return <HandHelping {...props} />;
    case "tution-teacher":
      return <BookOpenText {...props} />;
    default:
      return <Settings2 {...props} />;
  }
}
