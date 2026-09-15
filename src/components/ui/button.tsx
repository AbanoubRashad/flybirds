import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-300 ease-brand active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-slate text-bone hover:bg-forest",
        forest: "bg-forest text-bone hover:bg-forest-deep",
        light: "bg-bone text-slate hover:bg-forest hover:text-bone",
        outline: "text-slate ring-1 ring-inset ring-line-strong hover:bg-slate hover:text-bone hover:ring-slate",
        "outline-light": "text-bone ring-1 ring-inset ring-bone/50 hover:bg-bone hover:text-slate hover:ring-bone",
        ghost: "text-slate hover:bg-slate/5",
        ember: "bg-ember text-slate hover:bg-[#e3843a]",
      },
      size: { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-sm", lg: "h-14 px-8 text-[15px]", icon: "size-11" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
