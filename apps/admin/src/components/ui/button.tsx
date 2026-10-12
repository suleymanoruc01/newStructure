import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.5rem] text-sm font-semibold transition-[transform,color,background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#D86A3A]",
        destructive:
          "bg-destructive text-destructive-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary/80",
        ghost:
          "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-card [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground",
        link: "text-primary underline-offset-4 [@media(hover:hover)_and_(pointer:fine)]:hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
