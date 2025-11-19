import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateRatingProps {
  vote: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CandidateRating({ vote, showLabel = false, size = "md" }: CandidateRatingProps) {
  const getRating = (voteValue: string | null) => {
    if (voteValue === "yes") return { stars: 5, label: "Shortlisted", color: "text-green-500" };
    if (voteValue === "maybe") return { stars: 3, label: "Under Review", color: "text-yellow-500" };
    if (voteValue === "no") return { stars: 1, label: "Rejected", color: "text-red-500" };
    return { stars: 0, label: "Not Rated", color: "text-muted-foreground" };
  };

  const rating = getRating(vote);
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
