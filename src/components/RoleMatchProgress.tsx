import { Progress } from "@/components/ui/progress";

interface RoleMatchProgressProps {
  percentage: number;
}

export function RoleMatchProgress({ percentage }: RoleMatchProgressProps) {
  return (
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <Progress value={percentage} className="h-2 flex-1" />
      <span className="text-sm font-medium text-muted-foreground min-w-[35px]">
        {percentage}%
      </span>
    </div>
  );
}
