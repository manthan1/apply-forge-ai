import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: string;
  trendColor?: string;
}

export function MetricCard({ title, value, icon: Icon, iconColor, trend, trendColor }: MetricCardProps) {
  return (
    <Card className="p-10 group">
      <div className="flex items-start justify-between">
        <div className="space-y-6">
          <div className={`w-16 h-16 rounded-3xl ${iconColor} flex items-center justify-center card-shadow-md group-hover:scale-110 smooth-transition`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-4xl font-bold text-foreground mb-2 tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground font-medium tracking-wide">{title}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-4 py-2 rounded-full ${trendColor} card-shadow`}>
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}
