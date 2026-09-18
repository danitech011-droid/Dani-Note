import { cn } from "@/lib/utils";

export const logoUrl = "/icon-512.png";

export function Logo({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={logoUrl}
      alt="Dani-Note logo"
      width={size}
      height={size}
      className={cn("rounded-[22%] object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({
  size = 36,
  className,
  subtitle,
  showText = true,
}: {
  size?: number;
  className?: string;
  subtitle?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={size} />
      {showText ? (
      <div className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-tight text-brand-gradient">
          Dani-Note
        </span>
        {subtitle ? (
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
