import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode; // Optional icon to display in the input field
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none transition-colors duration-200">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-gray-300/80 dark:border-gray-600/80",
            "bg-white dark:bg-gray-900 py-3 text-base",
            icon ? "pl-10 pr-4" : "px-4",
            "text-gray-900 dark:text-gray-100",
            "ring-offset-white dark:ring-offset-gray-950",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-400/70 dark:placeholder:text-gray-500/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
            "focus-visible:border-primary focus-visible:bg-white dark:focus-visible:bg-gray-900",
            "transition-all duration-200 ease-out",
            "shadow-sm focus-visible:shadow-md",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800/50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

