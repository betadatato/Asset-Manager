import { Link, useLocation } from "wouter";
import { Plus, FileText, Download, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center px-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg">
              E
            </div>
            <span className="font-semibold text-lg tracking-tight">Europass Builder</span>
          </Link>
          
          <nav className="flex items-center gap-4 text-sm lg:gap-6 flex-1">
            <Link 
              href="/" 
              className={`transition-colors hover:text-foreground/80 ${location === "/" ? "text-foreground font-medium" : "text-foreground/60"}`}
            >
              My CVs
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
