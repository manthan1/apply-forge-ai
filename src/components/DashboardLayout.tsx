import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 ml-[240px]">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-8">
          <h1 className="text-sm font-medium text-muted-foreground">Lumina HR</h1>
          <div className="flex items-center gap-4">
            <button className="text-sm text-muted-foreground hover:text-foreground">
              Device
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
