import { useEffect, useState } from "react";
import { Bike, MapPin, CheckCircle2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { VolunteerOpportunities } from "./VolunteerOpportunities";

export function VolunteerDashboard() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: o }, { data: m }] = await Promise.all([
      supabase.from("claims").select("*, donations(*)").is("volunteer_id", null).eq("status", "claimed"),
      supabase.from("claims").select("*, donations(*)").eq("volunteer_id", user.id).order("claimed_at", { ascending: false }),
    ]);
    setOpen(o ?? []); setMine(m ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const accept = async (c: any) => {
    if (!profile?.is_verified) return toast.error("Verification pending — admin will approve you soon.");
    const { error } = await supabase.from("claims").update({ volunteer_id: user!.id, status: "in_transit" }).eq("id", c.id);
    if (error) return toast.error(error.message);
    await supabase.from("donations").update({ status: "in_transit" }).eq("id", c.donation_id);
    toast.success("Task accepted! Head to pickup.");
    load();
  };

  const complete = async (c: any) => {
    await supabase.from("claims").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", c.id);
    await supabase.from("donations").update({ status: "completed" }).eq("id", c.donation_id);
    await supabase.from("impact_logs").insert({
      donation_id: c.donation_id, category: c.donations.category, quantity: c.donations.quantity,
      donor_id: c.donations.donor_id, ngo_id: c.ngo_id, volunteer_id: user!.id,
    });
    toast.success("Delivered! Thank you 🌱");
    load();
  };

  const done = mine.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Bike} value={open.length} label="Available tasks" />
        <Stat icon={MapPin} value={mine.filter(c => c.status === "in_transit").length} label="Active" />
        <Stat icon={Sprout} value={done} label="Rescues completed" />
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">Available pickups</h2>
        {loading ? (
          <div className="card-warm p-12 text-center text-muted-foreground">Loading…</div>
        ) : open.length === 0 ? (
          <div className="card-warm p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary-soft grid place-items-center"><Bike className="h-6 w-6 text-primary" /></div>
            <p className="mt-4 font-medium">No tasks right now</p>
            <p className="text-sm text-muted-foreground">New pickups will appear here in real time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {open.map((c) => (
              <div key={c.id} className="card-warm p-5">
                <Badge variant="outline" className="capitalize">{c.donations?.category}</Badge>
                <h3 className="mt-3 font-display text-lg font-semibold">{c.donations?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.donations?.quantity}</p>
                <p className="mt-3 text-sm flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />{c.donations?.pickup_address}
                </p>
                <Button onClick={() => accept(c)} className="mt-4 w-full bg-warm-gradient text-primary-foreground hover:opacity-90">Accept task</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">My tasks</h2>
        {mine.length === 0 ? (
          <div className="card-warm p-8 text-center text-muted-foreground">No tasks yet.</div>
        ) : (
          <div className="card-warm divide-y divide-border">
            {mine.map((c) => (
              <div key={c.id} className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.donations?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.donations?.pickup_address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{c.status.replace("_", " ")}</Badge>
                  {c.status === "in_transit" && (
                    <Button size="sm" onClick={() => complete(c)} className="bg-secondary text-secondary-foreground hover:opacity-90">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />Mark delivered
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <VolunteerOpportunities />
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Bike; value: number; label: string }) {
  return (
    <div className="card-warm p-5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
