import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// --- Constants ---
const SUCCESS_MESSAGE = "Thanks for signing up! We'll be in touch soon.";
const ERROR_MESSAGE_INVALID_EMAIL = "Please enter a valid email address";
const EMAIL_REGEX = /^\S+@\S+\.\S+$/; // Basic email format regex
const SUBMITTING_TEXT = "Submitting...";
const SUBMIT_TEXT = "Sign Up";

/**
 * Renders an email signup form.
 * Handles basic client-side validation and simulated submission with toasts.
 */
export const EmailSignupForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email format
    if (!email.trim() || !EMAIL_REGEX.test(email)) {
      toast.error(ERROR_MESSAGE_INVALID_EMAIL);
      return;
    }

    setIsSubmitting(true);

    // TODO: Replace with actual API call
    // Simulated API call for demonstration
    console.log("Simulating signup for:", email);
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail("");
      toast.success(SUCCESS_MESSAGE);
      // TODO: Add error handling for real API calls
    }, 1000); // Simulate 1 second network delay
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Label htmlFor="email-signup" className="sr-only">
          Email Address
        </Label>
        <Input
          id="email-signup"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md bg-muted/30 border-muted placeholder:text-muted-foreground/70"
          required
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/80 text-white font-medium"
        >
          {isSubmitting ? SUBMITTING_TEXT : SUBMIT_TEXT}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center sm:text-left">
        Stay updated on our projects & opportunities
      </p>
    </form>
  );
};
