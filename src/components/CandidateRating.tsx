import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateRatingProps {
  percentage: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CandidateRating({ percentage, showLabel = false, size = "md" }: CandidateRatingProps) {
  const getRating = (pct: number) => {
    if (pct >= 80) return { stars: 5, label: "Excellent Match", color: "text-green-500" };
    if (pct >= 60) return { stars: 4, label: "Good Match", color: "text-blue-500" };
    if (pct >= 40) return { stars: 3, label: "Fair Match", color: "text-yellow-500" };
    if (pct >= 20) return { stars: 2, label: "Poor Match", color: "text-orange-500" };
    return { stars: 1, label: "Weak Match", color: "text-red-500" };
  };

  const rating = getRating(percentage);
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              i < rating.stars ? cn(rating.color, "fill-current") : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", rating.color)}>
          {rating.label}
        </span>
      )}
    </div>
  );
}
