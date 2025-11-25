import { ExternalLink, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/50 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6 text-center max-w-3xl mx-auto">
          {/* Brand Name */}
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent tracking-tight">
              PHAZEAI
            </h2>
          </div>

          {/* Tagline */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            This is a bot created by <span className="font-semibold text-foreground">PHAZEAI</span> to automate your business and remove manual tasks
          </p>

          {/* Links and Contact */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-sm sm:text-base pt-2">
            <a
              href="https://www.phazeai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium group"
            >
              <ExternalLink className="h-5 w-5 group-hover:scale-110 transition-transform" />
              www.phazeai.com
            </a>
            
            <div className="hidden sm:block h-6 w-px bg-border" />
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Contact: Manthan Jethwani</span>
                <a 
                  href="tel:7990700545" 
                  className="text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  7990700545
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="pt-4 border-t border-border/50 w-full">
            <p className="text-xs text-muted-foreground">
              Powered by PHAZEAI - Automating businesses with intelligent solutions
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
