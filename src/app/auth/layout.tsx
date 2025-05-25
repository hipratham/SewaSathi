import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <Sparkles className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold text-foreground">SewaSathi</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SewaSathi. All rights reserved.
      </p>
    </div>
  );
}
