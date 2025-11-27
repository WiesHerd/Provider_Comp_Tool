import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, disabled, onDrag, onDragStart, onDragEnd, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false);
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
          "min-h-[44px] min-w-[44px] text-base",
          "relative overflow-hidden",
          variant === "default" && [
            "bg-primary text-white",
            "shadow-sm hover:shadow-md active:shadow-sm",
            "hover:bg-primary-light active:bg-primary-dark",
            "hover:scale-[1.02] active:scale-[0.98]",
          ],
          variant === "outline" && [
            "border border-primary text-primary",
            "bg-white dark:bg-gray-900",
            "shadow-sm hover:shadow-md active:shadow-sm",
            "hover:bg-primary/5 active:bg-primary/10",
            "hover:border-primary active:border-primary",
            "hover:scale-[1.02] active:scale-[0.98]",
          ],
          variant === "ghost" && [
            "text-gray-700 dark:text-gray-300",
            "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
            "active:bg-gray-200/80 dark:active:bg-gray-700/80",
            "hover:scale-[1.02] active:scale-[0.98]",
          ],
          size === "default" && "px-6 py-3",
          size === "sm" && "px-4 py-2 text-base min-h-[44px]",
          size === "lg" && "px-8 py-4 text-lg",
          className
        )}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...(props as any)}
      >
        {variant === "default" && (
          <motion.div
            className="absolute inset-0 bg-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isPressed ? 0.2 : 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };

