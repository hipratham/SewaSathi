
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'sewaSathiCookieConsent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consentGiven) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg p-4 md:p-6 z-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-start md:items-center gap-3">
          <Cookie className="h-8 w-8 md:h-6 md:w-6 text-primary flex-shrink-0 mt-1 md:mt-0" />
          <p className="text-sm text-foreground">
            We use cookies to ensure you get the best experience on our website. 
            These cookies are essential for site functionality, like keeping you logged in. By continuing to use this site, you agree to our use of these essential cookies.
          </p>
        </div>
        <Button onClick={handleAccept} size="lg" className="w-full md:w-auto flex-shrink-0">
          Accept & Close
        </Button>
      </div>
    </div>
  );
}
