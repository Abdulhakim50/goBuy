// src/app/error.tsx
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react'; // Example icon

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }; // Error object, potentially with digest from server errors
    reset: () => void; // Function to attempt re-rendering the segment
}) {
    useEffect(() => {
        // Log the error to an error reporting service (e.g., Sentry, LogRocket)
        // In a real app, send `error` and `error.digest` here
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <html lang="en"> {/* Need html/body if it's the root error boundary */}
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-background"> {/* Full screen */}
                    <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-3xl font-bold text-destructive mb-2">Something went wrong!</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {/* Display a generic message in production */}
                        {process.env.NODE_ENV === 'development'
                            ? error.message || 'An unexpected error occurred.'
                            : 'An unexpected error occurred. Please try again later.'}
                    </p>
                     {/* Optional: Display digest in development */}
                    {process.env.NODE_ENV === 'development' && error.digest && (
                        <p className="text-sm text-muted-foreground mb-6 font-mono">Error Digest: {error.digest}</p>
                     )}
                    <Button
                        onClick={
                            // Attempt to recover by trying to re-render the segment
                            () => reset()
                        }
                    >
                        Try Again
                    </Button>
                     <Button variant="link" asChild className="mt-4">
                        <a href="/">Go Back Home</a>{/* Use regular anchor tag here as Link might also fail */}
                    </Button>
                </div>
            </body>
        </html>
    );
}