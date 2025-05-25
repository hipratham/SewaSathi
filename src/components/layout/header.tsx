import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/providers", label: "Find Providers" },
  { href: "/request-service", label: "Request Service" },
  { href: "/provider-setup", label: "For Providers" },
];

export default function Header() {
  // Mock authentication state
  const isAuthenticated = false; 

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">SewaSathi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {isAuthenticated ? (
            <Button variant="outline">Sign Out</Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 p-4">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold text-foreground">SewaSathi</span>
                </Link>
                {navLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <hr className="my-2"/>
                 {isAuthenticated ? (
                  <Button variant="outline" className="w-full">Sign Out</Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
