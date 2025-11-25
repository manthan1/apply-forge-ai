import { ExternalLink, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-foreground">PHAZEAI</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            This is a bot created by PHAZEAI to automate your business and remove manual tasks
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
            <a
              href="https://www.phazeai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              www.phazeai.com
            </a>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>Contact: Manthan Jethwani</span>
              <a href="tel:7990700545" className="text-primary hover:underline">
                7990700545
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
