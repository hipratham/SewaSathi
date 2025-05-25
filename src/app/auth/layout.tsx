
"use client"; // Add "use client" if it's not already there for hooks

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react"; // Import hooks

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

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
      {currentYear && ( // Conditionally render the paragraph once currentYear is set
        <p className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {currentYear} SewaSathi. All rights reserved.
        </p>
      )}
      {!currentYear && ( // Optional: placeholder or empty space while year loads
        <p className="mt-8 text-center text-sm text-muted-foreground" style={{ height: '1.25em' }}>
          &nbsp; {/* Or some loading dots, or just adjust height to prevent layout shift */}
        </p>
      )}
    </div>
  );
}
