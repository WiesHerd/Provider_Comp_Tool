import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-h-[44px] min-w-[44px] text-base",
          variant === "default" && "bg-primary text-white hover:bg-primary-light",
          variant === "outline" && "border-2 border-primary text-primary hover:bg-primary/10",
          variant === "ghost" && "hover:bg-gray-100 dark:hover:bg-gray-800",
          size === "default" && "px-6 py-3",
          size === "sm" && "px-4 py-2 text-sm",
          size === "lg" && "px-8 py-4 text-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

