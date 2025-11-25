import { ExternalLink, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>This bot is created by Phaze AI to automate your business</p>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <a
            href="https://www.phazeai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            www.phazeai.com
          </a>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Manthan Jethwani</span>
            <a href="tel:7990700545" className="text-primary hover:text-primary/80 transition-colors">
              7990700545
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
