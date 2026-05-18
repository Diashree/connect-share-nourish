import { Link } from "@tanstack/react-router";
import { Sprout, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { NotificationsBell } from "@/components/NotificationsBell";

export function SiteHeader() {
  const { session, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-warm-gradient text-primary-foreground shadow-soft">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            FoodConnect<span className="text-secondary">+</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition" activeOptions={{ exact: true }}>Home</Link>
          <a href="/#how" className="hover:text-foreground transition">How it works</a>
          <a href="/#impact" className="hover:text-foreground transition">Impact</a>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <NotificationsBell />
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1.5" />Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
              <Button asChild size="sm" className="bg-warm-gradient hover:opacity-90 text-primary-foreground shadow-soft">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
