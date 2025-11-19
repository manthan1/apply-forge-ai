import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Briefcase, Users, BarChart3, Plus, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "Jobs", path: "/", icon: Briefcase },
    { title: "Candidates", path: "/dashboard", icon: Users },
    { title: "Analytics", path: "/dashboard", icon: BarChart3 },
  ];

  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "HR";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Lumina</span>
        </div>
      </div>

      {/* Create New Job Button */}
      <div className="px-4 mb-6">
        <Button asChild className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to="/">
            <Plus className="h-4 w-4" />
            Create New Job
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email?.split("@")[0] || "HR User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Head of Talent
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={signOut}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
