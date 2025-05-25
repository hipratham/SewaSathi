
"use client"; 

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react"; 

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<string | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4 md:p-8">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-primary group-hover:animate-pulse" />
          <span className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">SewaSathi</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        {currentYear ? `© ${currentYear} SewaSathi. All rights reserved.` : <span style={{ height: '1.25em', display: 'inline-block' }}>&nbsp;</span>}
      </p>
    </div>
  );
}
