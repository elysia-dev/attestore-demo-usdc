import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center disabled:opacity-50 justify-center gap-2 whitespace-nowrap rounded-full font-medium disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer transition-all duration-300 hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(255,0,122,0.3)] hover:shadow-[0_0_30px_rgba(255,0,122,0.4)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-secondary/50 hover:bg-secondary/70 text-foreground",
        outlineBlue:
          "border border-primary/20 text-primary bg-primary/10 hover:bg-primary/20",
        secondary:
          "bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 border border-border/50",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "button-text px-5 py-2.5 max-sm:px-4 max-sm:py-2",
        max: "button-text w-full py-2.5 max-sm:py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "body px-5 py-2.5 max-sm:px-4 max-sm:py-2",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
