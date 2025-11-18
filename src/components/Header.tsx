import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, LogOut, LayoutDashboard, Plus } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                HR Portal
              </span>
              <p className="text-xs text-muted-foreground">AI-Powered Hiring</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              asChild
              size="default"
              className="gap-2"
            >
              <Link to="/">
                <Plus className="h-4 w-4" />
                Create Form
              </Link>
            </Button>
            
            <Button
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              asChild
              size="default"
              className="gap-2"
            >
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

            <Button variant="outline" size="default" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
