import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, LogOut, LayoutDashboard, Plus } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Briefcase className="h-6 w-6 text-primary" />
            <span>HR Portal</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              asChild
              size="sm"
            >
              <Link to="/">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Link>
            </Button>
            
            <Button
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              asChild
              size="sm"
            >
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
