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
    <Card className="glass-effect p-8 border-0 card-shadow-lg hover:card-shadow-lg smooth-transition hover:scale-[1.02] group">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className={`w-14 h-14 rounded-2xl ${iconColor} flex items-center justify-center shadow-lg group-hover:scale-110 smooth-transition`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${trendColor}`}>
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}
