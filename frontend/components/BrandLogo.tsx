import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

const ASSETS = {
  mark: "/brand/logo/SVG/logo-01.svg",
  stacked: "/brand/logo/SVG/logo-05.svg",
  horizontal: "/brand/logo/SVG/logo-09.svg",
} as const;

export type BrandLogoVariant = keyof typeof ASSETS;

const SIZES: Record<BrandLogoVariant, { width: number; height: number }> = {
  mark: { width: 48, height: 40 },
  stacked: { width: 280, height: 280 },
  horizontal: { width: 280, height: 120 },
};

export function BrandLogo({
  variant = "horizontal",
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
  variant = "horizontal",
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
