import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { REQUEST_CATEGORIES, type RequestCategory } from "@/lib/request-categories";
import { RequestModal } from "./RequestModal";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function RaiseRequestSection() {
  const [active, setActive] = useState<RequestCategory | null>(null);
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const nav = useNavigate();

  const onPick = (cat: RequestCategory) => {
    if (!session) {
      toast.info("Please sign in to raise a request");
      nav({ to: "/login" });
      return;
    }
    setActive(cat);
    setOpen(true);
  };

  return (
    <section id="raise-request" className="border-t border-border/60 bg-card/40">
      <div className="container mx-auto px-4 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-foreground">For those in need</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold tracking-tight">Raise Request</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Need help? Pick a category below — your request goes to every partner NGO instantly.
          </p>
        </div>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible md:px-0 md:mx-0">
          {REQUEST_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => onPick(c)}
                className={`group snap-start flex-shrink-0 w-44 md:w-auto text-left card-warm p-5 bg-gradient-to-br ${c.gradient} hover:scale-[1.02] active:scale-[0.98] transition-transform`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl bg-background/80 ${c.iconColor} shadow-soft group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground/70 group-hover:text-foreground transition">
                  Raise request <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <RequestModal category={active} open={open} onOpenChange={setOpen} />
    </section>
  );
}
