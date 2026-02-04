import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@magicborn/shared/lib/utils"

const kbdVariants = cva(
  "inline-flex items-center rounded border px-1.5 font-mono text-[0.625rem] font-medium text-muted-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-muted border-border",
        outline: "bg-background border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(kbdVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

interface KbdGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  separator?: string;
}

const KbdGroup = React.forwardRef<HTMLDivElement, KbdGroupProps>(
  ({ className, separator = "+", children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const items = childrenArray.map((child, index) => (
      <React.Fragment key={index}>
        {child}
        {index < childrenArray.length - 1 && (
          <span className="mx-1 text-muted-foreground">{separator}</span>
        )}
      </React.Fragment>
    ));

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-0.5", className)}
        {...props}
      >
        {items}
      </div>
    );
  }
);
KbdGroup.displayName = "KbdGroup";

export { Kbd, KbdGroup, kbdVariants }
