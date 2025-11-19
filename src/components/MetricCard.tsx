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
    <Card className="p-6 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className={`w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center mb-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-medium px-2 py-1 rounded ${trendColor}`}>
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}
