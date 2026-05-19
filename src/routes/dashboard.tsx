import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, type AppRole } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { DonorDashboard } from "@/components/dashboards/DonorDashboard";
import { NGODashboard } from "@/components/dashboards/NGODashboard";
import { VolunteerDashboard } from "@/components/dashboards/VolunteerDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const ROLE_BADGE: Record<AppRole, string> = {
  donor: "bg-info/20 text-foreground border-info/40",
  ngo: "bg-primary/20 text-primary border-primary/40",
  volunteer: "bg-amber/20 text-amber-foreground border-amber/40",
  admin: "bg-secondary/20 text-secondary-foreground border-secondary/40",
};

function DashboardPage() {
  const { session, role, profile, user, loading, refresh } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/login" });
  }, [loading, session, nav]);

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  const needsVerification = (role === "ngo" || role === "volunteer") && profile && !profile.is_verified;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{profile?.name ?? "friend"}</h1>
          </div>
          {role && (
            <Badge className={`${ROLE_BADGE[role]} border text-sm px-3 py-1 capitalize font-medium`}>
              {role}
            </Badge>
          )}
        </div>

        {needsVerification && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/10 p-4">
            <ShieldCheck className="h-5 w-5 text-amber-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Your account is pending verification.</p>
              <p className="text-muted-foreground mt-0.5">An admin will review your profile shortly. You'll be notified once approved.</p>
            </div>
          </div>
        )}

        {role === "donor" && <DonorDashboard />}
        {role === "ngo" && <NGODashboard />}
        {role === "volunteer" && <VolunteerDashboard />}
        {role === "admin" && <AdminDashboard />}
        {!role && user && <CompleteProfile userId={user.id} onSaved={refresh} />}
      </main>
    </div>
  );
}

function CompleteProfile({ userId, onSaved }: { userId: string; onSaved: () => Promise<void> }) {
  const [picked, setPicked] = useState<AppRole | "">("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: picked });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Role saved!");
    await onSaved();
  };

  return (
    <div className="card-warm p-10 max-w-md mx-auto text-center">
      <h2 className="font-display text-2xl font-semibold">Complete your profile</h2>
      <p className="text-muted-foreground text-sm mt-2">Pick how you'd like to participate in FoodConnect+.</p>
      <div className="mt-6 space-y-3 text-left">
        <Select value={picked} onValueChange={(v) => setPicked(v as AppRole)}>
          <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="donor">Donor</SelectItem>
            <SelectItem value="ngo">NGO / Receiver</SelectItem>
            <SelectItem value="volunteer">Volunteer</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={save} disabled={!picked || saving} className="w-full bg-warm-gradient text-primary-foreground hover:opacity-90">
          {saving ? "Saving…" : "Save role"}
        </Button>
      </div>
    </div>
  );
}
