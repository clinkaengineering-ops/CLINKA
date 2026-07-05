import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

const ASSETS = {
  mark: "/brand/mark.svg",
  stacked: "/brand/stacked.svg",
  horizontal: "/brand/horizontal.svg",
} as const;

export type BrandLogoVariant = keyof typeof ASSETS;

const SIZES: Record<BrandLogoVariant, { width: number; height: number }> = {
  mark: { width: 150, height: 120 },
  stacked: { width: 320, height: 320 },
  horizontal: { width: 360, height: 140 },
};

export function BrandLogo({
  variant = "mark",
  className,
  priority,
}: {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const size = SIZES[variant];
  return (
    <Image
      src={ASSETS[variant]}
      alt="CLINKA — Civil Link Architecture"
      width={size.width}
      height={size.height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}

export function BrandLink({
  variant = "mark",
  className,
  logoClassName,
  priority,
}: {
  variant?: BrandLogoVariant;
  className?: string;
  logoClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0", className)}>
      <BrandLogo variant={variant} className={logoClassName} priority={priority} />
    </Link>
  );
}
