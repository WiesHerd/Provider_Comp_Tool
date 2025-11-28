import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({ isLoading, children, message = "Loading..." }: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
      {children}
    </div>
  );
}










