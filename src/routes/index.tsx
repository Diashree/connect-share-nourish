import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, HeartHandshake, Truck, MapPin, ArrowRight, Leaf, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-warm-gradient opacity-[0.06]"
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-amber-gradient opacity-20 blur-3xl"
        />
        <div className="container mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <Leaf className="h-3.5 w-3.5 text-secondary" />
              Community-driven surplus rescue
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-foreground md:text-7xl text-balance">
              Rescue surplus.<br />
              <span className="text-primary">Share abundance.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              FoodConnect+ links households, restaurants, NGOs, and volunteers so nothing goes to waste — and no one goes without.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-warm-gradient hover:opacity-90 text-primary-foreground shadow-warm h-12 px-6">
                <Link to="/register">Join the movement<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <Stat icon={Package} value="12,400+" label="items rescued" />
              <Stat icon={Users} value="3,200" label="active members" />
              <Stat icon={HeartHandshake} value="180" label="partner NGOs" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border/60 bg-card/40">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-secondary">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">From your kitchen to a kind hand — in four steps.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Step n="01" icon={Sprout} title="Post surplus" body="Donors list extra food, clothes, books, medicines or essentials with a few taps." />
            <Step n="02" icon={HeartHandshake} title="NGO claims" body="Verified NGOs see live listings nearby and claim what they need." />
            <Step n="03" icon={Truck} title="Volunteer picks up" body="Nearby volunteers accept the route and handle pickup and delivery." />
            <Step n="04" icon={MapPin} title="Impact tracked" body="Every rescue is logged so the whole community can see what we built." />
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="border-t border-border/60">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="rounded-3xl bg-warm-gradient p-10 md:p-16 text-primary-foreground shadow-warm">
            <p className="text-sm font-medium uppercase tracking-wider opacity-80">Real impact</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-balance">
              Every meal saved is a small act of repair.
            </h2>
            <p className="mt-5 max-w-2xl opacity-90 leading-relaxed">
              Surplus food is the world's most actionable climate fix and the most direct way to feed our neighbours. Be part of the loop.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 h-12 px-6">
                <Link to="/register">Get started — it's free<ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-secondary" />
            <span>© {new Date().getFullYear()} FoodConnect+ — built with care.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/register" className="hover:text-foreground">Register</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Leaf; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-secondary" />
      <span className="font-display text-lg font-semibold text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: typeof Leaf; title: string; body: string }) {
  return (
    <div className="card-warm p-7">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-display text-sm text-muted-foreground">{n}</span>
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
