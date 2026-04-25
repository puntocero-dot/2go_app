import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-[#1da1f2] text-white hover:bg-[#1a8cd3] shadow-[0_4px_14px_rgba(29,161,242,0.35)] hover:shadow-[0_6px_20px_rgba(29,161,242,0.45)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-white/15 bg-white/[0.05] text-foreground hover:bg-white/10 hover:border-white/25 backdrop-blur-sm",
        secondary:
          "bg-white/[0.08] text-foreground hover:bg-white/[0.12] border border-white/10",
        ghost:
          "text-foreground hover:bg-white/[0.07] hover:text-white",
        link:
          "text-[#1da1f2] underline-offset-4 hover:underline hover:text-[#7dd3fc]",
        gradient:
          "bg-gradient-to-r from-[#1da1f2] to-blue-500 text-white hover:opacity-90 shadow-[0_4px_14px_rgba(29,161,242,0.3)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-9 w-9",
        xl: "h-14 rounded-xl px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { gradient, ...domProps } = props as any;

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...domProps}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || "Cargando..."}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, enhancedButtonVariants };
