
"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/providers", label: "Find Providers" },
  { href: "/request-service", label: "Request Service" },
  // { href: "/provider-setup", label: "For Providers" }, // Replaced by role-based home
];

export default function Header() {
  const { user, role, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push("/"); // Redirect to home page after sign out
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ variant: "destructive", title: "Sign Out Failed", description: "Could not sign out. Please try again." });
    }
  };
  
  const providerSpecificLinks = role === 'provider' ? [{ href: "/provider-setup", label: "My Provider Profile" }] : [];
  const dashboardLink = user ? [{ href: "/dashboard", label: "Dashboard" }] : [];


  const allNavLinks = [...navLinks, ...providerSpecificLinks];


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground tracking-tight">SewaSathi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {allNavLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
           {user && dashboardLink.map(link => (
             <Button key={link.href} variant="ghost" asChild>
                <Link href={link.href} className="flex items-center">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {link.label}
                </Link>
              </Button>
           ))}
        </nav>
        
        <div className="hidden md:flex items-center gap-2">
         {loading ? null : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </>
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
                 {user && (
                    <SheetDescription className="flex items-center text-xs">
                        <UserCircle className="w-4 h-4 mr-1.5 text-muted-foreground"/> {user.email}
                    </SheetDescription>
                 )}
              </SheetHeader>
              <Separator className="mb-4"/>
              <div className="flex flex-col gap-2">
                {allNavLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start text-base py-3 h-auto">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                {user && dashboardLink.map(link => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start text-base py-3 h-auto">
                    <Link href={link.href} className="flex items-center">
                      <LayoutDashboard className="mr-2 h-5 w-5" /> {link.label}
                    </Link>
                  </Button>
                ))}
                <Separator className="my-2"/>
                 {loading ? null : user ? (
                  <Button variant="outline" className="w-full text-base py-3 h-auto" onClick={handleSignOut}>
                     <LogOut className="mr-2 h-5 w-5" /> Sign Out
                  </Button>
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
