import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center disabled:opacity-50 justify-center gap-[5px] whitespace-nowrap rounded-full font-medium disabled:pointer-events-none [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-blue-primary text-white hover:bg-blue-primary/80",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-black text-black hover:bg-black hover:text-white",
        outlineBlue:
          "border border-blue-primary text-blue-primary hover:bg-blue-primary hover:text-white",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
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
