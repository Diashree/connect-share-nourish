import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout, Home, Building2, Bike, ShieldCheck, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/auth";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const ROLES: { id: AppRole; title: string; desc: string; icon: typeof Home }[] = [
  { id: "donor", title: "Donor", desc: "Household, restaurant or business with surplus to share.", icon: Home },
  { id: "ngo", title: "NGO / Receiver", desc: "Registered organization, shelter or community group.", icon: Building2 },
  { id: "volunteer", title: "Volunteer", desc: "Help with pickup & delivery in your neighborhood.", icon: Bike },
];

function RegisterPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<AppRole | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", org: "", bio: "" });
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);

    // 1. Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { 
          name: form.name,
          role: role // Included in metadata so backend triggers can read it if needed
        },
      },
    });

    if (error) { 
      setLoading(false); 
      return toast.error(error.message); 
    }

    const userId = data.user?.id;

    if (userId) {
      try {
        // 2. Safely Upsert Profile (resolves race conditions with triggers)
        await supabase.from("profiles").upsert({
          id: userId,
          name: form.name,
          phone: form.phone || null,
          address: form.address || null,
          org_name: form.org || null,
          bio: form.bio || null,
        }, { onConflict: "id" });

        // 3. Safely Upsert Role (prevents the duplicate key crash)
        const { error: roleErr } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: userId, role: role }, 
            { onConflict: "user_id" } // Targets the unique constraint on user_id directly
          );

        if (roleErr) {
          setLoading(false);
          return toast.error(`Could not save role: ${roleErr.message}`);
        }
      } catch (err) {
        console.error("Database upsert step encountered an error:", err);
      }
    }

    setLoading(false);
    toast.success(
      role === "donor"
        ? "Account created! Welcome."
        : "Account created! An admin will verify your account shortly."
    );
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-warm-gradient text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">
            FoodConnect<span className="text-secondary">+</span>
          </span>
        </Link>

        <div className="mt-10">
          {step === 1 ? (
            <>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">
                How will you make impact?
              </h1>
              <p className="mt-3 text-muted-foreground">
                Pick the role that best describes you. You can join more roles later.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {ROLES.map((r) => {
                  const active = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`text-left card-warm p-6 transition relative ${
                        active ? "ring-2 ring-primary border-primary" : ""
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-xl ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary-soft text-primary"
                        }`}
                      >
                        <r.icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 font-display text-lg font-semibold">{r.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                      {active && <Check className="absolute top-4 right-4 h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
              {role && role !== "donor" && (
                <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber/10 border border-amber/30 p-4 text-sm">
                  <ShieldCheck className="h-5 w-5 text-amber-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    As a {role === "ngo" ? "verified NGO" : "volunteer"}, an admin will review your profile before you can{" "}
                    {role === "ngo" ? "claim donations" : "accept tasks"}.
                  </p>
                </div>
              )}
              <div className="mt-8 flex justify-between items-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Already have an account?
                </Link>
                <Button
                  disabled={!role}
                  onClick={() => setStep(2)}
                  className="bg-warm-gradient text-primary-foreground hover:opacity-90 h-11 px-6"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>
              <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
                Tell us about yourself
              </h1>
              <p className="mt-2 text-muted-foreground">
                You're joining as <span className="font-medium text-foreground capitalize">{role}</span>.
              </p>
              <form onSubmit={submit} className="mt-8 space-y-4 max-w-xl">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                {role === "ngo" && (
                  <div>
                    <Label htmlFor="org">Organization name</Label>
                    <Input
                      id="org"
                      required
                      value={form.org}
                      onChange={(e) => set("org", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="address">{role === "volunteer" ? "Service area" : "Address"}</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                {role !== "donor" && (
                  <div>
                    <Label htmlFor="bio">A short intro</Label>
                    <Textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-warm-gradient text-primary-foreground hover:opacity-90 h-11"
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
