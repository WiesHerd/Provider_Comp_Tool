import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "borderless" | "subtle";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      // Base styles
      "bg-white dark:bg-gray-900",
      // Variant styles
      variant === "default" && [
        "rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]",
        "hover:shadow-[0_4px_6px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.1)]",
        "transition-all duration-200 ease-out",
        "p-3 md:p-6",
      ],
      variant === "borderless" && [
        "md:rounded-xl md:border md:border-gray-200/60 md:dark:border-gray-800/60",
        "md:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]",
        "md:hover:shadow-[0_4px_6px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.1)]",
        "md:transition-all md:duration-200 md:ease-out",
        "p-3 md:p-6",
        // Mobile: no border, no shadow, edge-to-edge
      ],
      variant === "subtle" && [
        "border-b border-gray-200/40 dark:border-gray-800/40",
        "pb-4 md:pb-6",
        // Just a bottom border, minimal styling
      ],
      className
    )}
    role="article"
    whileHover={variant === "default" || variant === "borderless" ? { y: -1 } : {}}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 30,
    }}
    {...(props as any)}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl md:text-2xl font-semibold leading-tight tracking-tight",
      "text-gray-900 dark:text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm sm:text-base text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

