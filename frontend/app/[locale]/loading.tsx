import { BrandLogo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        {/* Animated backdrop glow */}
        <div className="absolute z-0 h-40 w-40 animate-pulse rounded-full bg-electric-500/10 blur-[50px] dark:bg-electric-500/20" />
        
        {/* Floating logo */}
        <div className="animate-float relative z-10 drop-shadow-xl">
          <BrandLogo variant="mark" className="h-24 w-auto sm:h-28" priority />
        </div>
      </div>

      {/* Premium loading indicators */}
      <div className="animate-fade-up mt-8 flex items-center gap-2.5" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-electric-500 shadow-sm shadow-electric-500/20" style={{ animationDelay: "0ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-copper shadow-sm shadow-brand-copper/20" style={{ animationDelay: "150ms" }} />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-electric-500 shadow-sm shadow-electric-500/20" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
