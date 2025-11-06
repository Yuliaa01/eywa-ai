import { toast } from "@/hooks/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleAuthError = (error: any) => {
  console.error("Auth error:", error);
  
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Invalid email or password",
    "Email not confirmed": "Please confirm your email address",
    "User already registered": "This email is already registered",
    "Signup forbidden": "Sign up is currently disabled",
  };

  const message = errorMessages[error?.message] || error?.message || "Authentication failed";
  
  toast({
    title: "Authentication Error",
    description: message,
    variant: "destructive",
  });
};

export const handleDatabaseError = (error: any, context?: string) => {
  console.error(`Database error${context ? ` (${context})` : ""}:`, error);
  
  toast({
    title: "Database Error",
    description: error?.message || "Failed to perform database operation",
    variant: "destructive",
  });
};

export const handleApiError = (error: any, context?: string) => {
  console.error(`API error${context ? ` (${context})` : ""}:`, error);
  
  toast({
    title: "API Error",
    description: error?.message || "Failed to communicate with the server",
    variant: "destructive",
  });
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorHandler?: (error: any) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error("Unhandled error:", error);
    }
    return null;
  }
};
