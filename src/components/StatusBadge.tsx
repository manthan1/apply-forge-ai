import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    new: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "New" },
    shortlisted: { color: "bg-orange-50 text-orange-700 border-orange-200", label: "Shortlisted" },
    interviewing: { color: "bg-purple-50 text-purple-700 border-purple-200", label: "Interviewing" },
    rejected: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Rejected" },
    offered: { color: "bg-green-50 text-green-700 border-green-200", label: "Offered" },
    active: { color: "bg-green-50 text-green-700 border-green-200", label: "Active" },
    closed: { color: "bg-gray-50 text-gray-700 border-gray-200", label: "Closed" },
  };

  const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.new;

  return (
    <Badge variant="outline" className={`${config.color} border`}>
      {config.label}
    </Badge>
  );
}
