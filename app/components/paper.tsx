import { cn } from "~/lib/utils";
import { forwardRef } from "react";

interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "plain" | "lined" | "grid";
}

const Paper = forwardRef<HTMLDivElement, PaperProps>(
  ({ className, variant = "plain", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full min-h-[400px] bg-[#fdfbf7] text-gray-800 shadow-xl rounded-sm overflow-hidden isolate",
          "before:absolute before:inset-0 before:pointer-events-none before:-z-10",
          variant === "lined" &&
            "before:bg-[linear-gradient(transparent_1.5rem,#e5e7eb_1.5rem)] before:bg-size-[100%_1.5rem] before:mt-6",
          variant === "grid" &&
            "before:bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] before:bg-size-[1.5rem_1.5rem]",
          className
        )}
        style={{
            boxShadow: "1px 1px 2px rgba(0,0,0,0.05), 2px 2px 4px rgba(0,0,0,0.05), 4px 4px 8px rgba(0,0,0,0.05)"
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Paper.displayName = "Paper";

export { Paper };
