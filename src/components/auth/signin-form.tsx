
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { LogIn, Loader2, Phone, MailQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendPasswordResetEmail, 
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User 
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import type { UserRole } from "@/lib/types"; 
import { useState, type ChangeEvent } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  resetEmail: z.string().email({ message: "Invalid email address." }),
});

export default function SignInForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");


  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const handleSuccessfulSignIn = async (user: User) => {
    try {
      const idToken = await user.getIdToken(true);
      const sessionResponse = await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create server session.');
      }
    } catch (sessionError: any) {
      console.error("Session login error:", sessionError);
      toast({
        variant: "destructive",
        title: "Session Error",
        description: sessionError.message || "Could not create a server session. You are logged in client-side only.",
      });
    }

    const userRoleRef = ref(database, `users/${user.uid}/role`);
    const snapshot = await get(userRoleRef); 

    let role: UserRole = null;
    if (snapshot.exists()) {
      role = snapshot.val() as UserRole;
    } else {
       const userEmail = user.email;
       const isGoogleSignIn = user.providerData.some(p => p.providerId === GoogleAuthProvider.PROVIDER_ID);

       if (isGoogleSignIn) {
         const userNodeRef = ref(database, `users/${user.uid}`);
         const userNodeSnapshot = await get(userNodeRef);
         if (!userNodeSnapshot.exists() && userEmail) {
           const userName = user.displayName || user.email?.split('@')[0] || "User";
           await set(ref(database, `users/${user.uid}`), {
              name: userName,
              email: userEmail,
              role: "seeker", 
           });
           role = "seeker";
           toast({
              title: "Welcome!",
              description: "Your new SewaSathi account is ready (defaulted to Service Seeker).",
           });
         } else {
             toast({
              variant: "destructive",
              title: "Sign In Problem",
              description: "Your role could not be determined. Please contact support if this issue persists.",
            });
            return false;
         }
       } else {
         toast({
            variant: "destructive",
            title: "Sign In Problem (Role Missing)",
            description: "Your user role is not configured in the database. Please ensure your account (especially admin/provider) is set up correctly by an administrator or try signing up.",
          });
          return false; 
       }
    }
    
    if (role) { 
        toast({
          title: "Signed In!",
          description: `Welcome back to SewaSathi! Role: ${role}`,
        });

        if (role === "provider") {
          router.push("/home-provider");
        } else if (role === "seeker") {
          router.push("/home-seeker");
        } else if (role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/"); 
        }
        return true;
    }
    return false;
  };

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    setIsLoading(true);
    try {
      const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleSuccessfulSignIn(userCredential.user);
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please check your credentials.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/Password sign-in is not enabled for this app. Please contact support.";
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = "The API key for Firebase is invalid. Please contact support.";
      }
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // For Google Sign-In, persistence is typically managed by Google's session.
      // You might still call setPersistence for consistency if needed, but it's less critical here.
      // await setPersistence(auth, browserLocalPersistence); // Example: default to local for Google
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulSignIn(result.user);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign In Failed",
        description: error.message || "Could not sign in with Google. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }
    try {
      resetPasswordSchema.parse({ resetEmail });
    } catch (err) {
       if (err instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: err.errors[0].message,
        });
      } else {
         toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address.",
        });
      }
      return;
    }

    setIsPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a reset link has been sent. Please check your inbox (and spam folder).",
      });
      setShowPasswordResetForm(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
         toast({
          title: "Password Reset Email Sent",
          description: "If an account exists for this email, a reset link has been sent. Please check your inbox (and spam folder).",
        });
         setShowPasswordResetForm(false);
         setResetEmail("");
         setIsPasswordResetLoading(false);
         return; 
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      }
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: errorMessage,
      });
    } finally {
      setIsPasswordResetLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!showPasswordResetForm ? (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
                <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isGoogleLoading}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                        Remember me
                        </FormLabel>
                    </div>
                    </FormItem>
                )}
                />
                <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal text-sm"
                    onClick={() => {
                    setShowPasswordResetForm(true);
                    const currentEmail = form.getValues("email");
                    if (z.string().email().safeParse(currentEmail).success) {
                        setResetEmail(currentEmail);
                    } else {
                        setResetEmail("");
                    }
                    }}
                    disabled={isLoading || isGoogleLoading}
                >
                    Forgot password?
                </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4"/>}
              Sign In
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
              Sign in with Google
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" type="button" className="w-full" disabled={true || isLoading || isGoogleLoading}>
                    <Phone className="mr-2 h-4 w-4" />
                    Sign in with Phone (Coming Soon)
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Phone number sign-in will be available soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" asChild className="px-0">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Reset Password</h3>
              <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a link to reset your password.</p>
            </div>
             <FormItem>
                <FormLabel htmlFor="resetEmail">Email Address</FormLabel>
                <Input 
                  id="resetEmail"
                  type="email" 
                  placeholder="you@example.com" 
                  value={resetEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)} 
                  disabled={isPasswordResetLoading} 
                />
            </FormItem>
            <Button type="button" onClick={handlePasswordReset} className="w-full" disabled={isPasswordResetLoading}>
              {isPasswordResetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MailQuestion className="mr-2 h-4 w-4"/>}
              Send Reset Link
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowPasswordResetForm(false);
                setResetEmail("");
              }}
              disabled={isPasswordResetLoading}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
