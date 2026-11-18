import { cn } from "@/lib/utils";

interface BambooLogoProps {
  className?: string;
  subtitle?: string;
  size?: "md" | "lg";
}

/**
 * Logo provisório do Bamboo (ícone + nome espaçado).
 * Para usar o logo oficial, troque o <svg> por um <img src="/logo.svg" />.
 */
export default function BambooLogo({
  className,
  subtitle,
  size = "md",
}: BambooLogoProps) {
  const iconSize = size === "lg" ? 56 : 44;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
        className="flex-shrink-0 text-foreground"
      >
        <circle cx="22" cy="22" r="20" stroke="currentColor" strokeWidth="2" />
        <ellipse
          cx="17.6"
          cy="22.5"
          rx="4"
          ry="8.5"
          transform="rotate(-24 17.6 22.5)"
          fill="currentColor"
        />
        <ellipse
          cx="26.4"
          cy="22.5"
          rx="4"
          ry="8.5"
          transform="rotate(24 26.4 22.5)"
          fill="currentColor"
        />
      </svg>

      <div className="flex flex-col gap-1 min-w-0">
        <span
          className={cn(
            "font-display font-medium leading-none tracking-[0.32em] text-foreground",
            size === "lg" ? "text-4xl" : "text-[28px]"
          )}
        >
          BAMBOO
        </span>
        {subtitle && <span className="eyebrow">{subtitle}</span>}
      </div>
    </div>
  );
}
