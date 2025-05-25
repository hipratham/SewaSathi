import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/providers", label: "Find Providers" },
  { href: "/request-service", label: "Request Service" },
  { href: "/provider-setup", label: "For Providers" },
];

export default function Header() {
  // Mock authentication state - in a real app, this would come from context or session
  const isAuthenticated = false; // Change to true to see authenticated state

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">SewaSathi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
           {isAuthenticated && (
             <Button variant="ghost" asChild>
                <Link href="/dashboard" className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Link>
              </Button>
           )}
        </nav>
        
        <div className="hidden md:flex items-center gap-2">
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
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>
                    <Link href="/" className="flex items-center gap-2">
                      <Sparkles className="h-7 w-7 text-primary" />
                      <span className="text-xl font-bold text-foreground">SewaSathi</span>
                    </Link>
                </SheetTitle>
                <SheetDescription>
                    Your local service partner.
                </SheetDescription>
              </SheetHeader>
              <Separator className="mb-4"/>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start text-base py-3 h-auto">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                {isAuthenticated && (
                  <Button variant="ghost" asChild className="justify-start text-base py-3 h-auto">
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                    </Link>
                  </Button>
                )}
                <Separator className="my-2"/>
                 {isAuthenticated ? (
                  <Button variant="outline" className="w-full text-base py-3 h-auto">Sign Out</Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start text-base py-3 h-auto">
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full text-base py-3 h-auto">
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
