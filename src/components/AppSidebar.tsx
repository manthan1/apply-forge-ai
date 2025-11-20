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
    { title: "Jobs", path: "/jobs", icon: Briefcase },
    { title: "Candidates", path: "/candidates", icon: Users },
  ];

  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "HR";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] glass-effect border-r border-border/50 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Create New Job Button */}
      <div className="px-4 mb-8">
        <Button asChild className="w-full justify-start gap-2">
          <Link to="/">
            <Plus className="h-4 w-4" />
            Create New Job
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold smooth-transition ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 m-3 rounded-xl">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.email?.split("@")[0] || "HR User"}</p>
            <p className="text-xs text-muted-foreground truncate">HR Manager</p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-accent" onClick={signOut} title="Logout">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
