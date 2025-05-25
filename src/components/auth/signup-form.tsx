
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile, type User } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { useState } from "react";

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

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  role: z.enum(["seeker", "provider"], { required_error: "Please select a role." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function handleSuccessfulSignUp(user: User, name: string, email: string, role: "seeker" | "provider") {
    if (user.displayName !== name && name) {
        try {
            await updateProfile(user, { displayName: name });
        } catch (profileError) {
            console.warn("Could not update Firebase Auth profile display name:", profileError);
        }
    }

    const userRoleRef = ref(database, `users/${user.uid}/role`);
    const roleSnapshot = await get(userRoleRef);

    if (roleSnapshot.exists()) {
        console.log("User already has a role, not overwriting.");
        toast({
            title: "Account Linked!",
            description: "Your Google account has been linked to your existing SewaSathi profile.",
        });
    } else {
        await set(ref(database, `users/${user.uid}`), {
          name: name,
          email: email,
          role: role,
        });
         toast({
          title: "Account Created!",
          description: "Welcome to SewaSathi!",
        });
    }

    try {
      const idToken = await user.getIdToken(true);
      await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } catch (sessionError) {
      console.error("Session login error:", sessionError);
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "Could not create a server session. You are logged in client-side only.",
      });
    }

    if (role === "provider") {
      router.push("/home-provider");
    } else {
      router.push("/home-seeker");
    }
  }

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await handleSuccessfulSignUp(userCredential.user, values.name, values.email, values.role);
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = error.message || "Failed to create account. Please try again.";
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: errorMessage.includes("email-already-in-use") 
          ? "This email is already registered. Try signing in or use Google to link accounts."
          : errorMessage.includes("auth/operation-not-allowed")
          ? "Sign-up with Email/Password is not enabled. Please try Google Sign-Up or contact support."
          : errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    const selectedRole = form.getValues("role");
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Role Required",
        description: "Please select whether you are a Service Seeker or Provider before signing up with Google.",
      });
      form.setError("role", { type: "manual", message: "Please select a role." });
      return;
    }

    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const name = user.displayName || form.getValues("name") || "Google User";
      const email = user.email;

      if (!email) {
        toast({
            variant: "destructive",
            title: "Google Sign Up Failed",
            description: "Could not retrieve email from Google. Please try again or use email sign up.",
        });
        setIsGoogleLoading(false);
        return;
      }
      
      await handleSuccessfulSignUp(user, name, email, selectedRole);

    } catch (error: any) {
      console.error("Google sign up error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign Up Failed",
        description: error.message || "Could not sign up with Google. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                <Input type="password" placeholder="•••••••• (min. 6 characters)" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                  disabled={isLoading || isGoogleLoading}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="seeker" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Service Seeker (Looking for help)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="provider" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Service Provider (Offering services)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>Select your role before signing up with Google.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
          Sign Up with Email
        </Button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with
            </span>
          </div>
        </div>

        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
          Sign up with Google
        </Button>

         <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" asChild className="px-0">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </p>
      </form>
    </Form>
  );
}
