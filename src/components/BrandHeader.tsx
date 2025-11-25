import { Zap } from "lucide-react";

export function BrandHeader() {
  return (
    <div className="w-full border-b border-border bg-gradient-to-r from-background via-primary/5 to-background py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Zap className="h-7 w-7 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Phaze AI
          </h1>
        </div>
      </div>
    </div>
  );
}
