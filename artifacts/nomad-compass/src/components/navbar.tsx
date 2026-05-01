import { Link } from "wouter";
import { Compass } from "lucide-react";

export function Navbar() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Compass className="w-6 h-6" />
          <span className="font-semibold text-lg tracking-tight text-foreground">Nomad Compass</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/compare" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Compare
          </Link>
          <Link href="/recommendations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            AI Picks
          </Link>
        </nav>
      </div>
    </header>
  );
}
