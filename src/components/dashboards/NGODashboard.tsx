import { useEffect, useState } from "react";
import { MapPin, Package, HandHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SupportingDonors } from "./SupportingDonors";

interface Donation {
  id: string; title: string; category: string; quantity: string;
  pickup_address: string; status: string; created_at: string; donor_id: string;
}

export function NGODashboard() {
  const { user, profile } = useAuth();
  const [available, setAvailable] = useState<Donation[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [{ data: avail }, { data: my }] = await Promise.all([
      supabase.from("donations").select("*").eq("status", "available").order("created_at", { ascending: false }).limit(30),
      supabase.from("claims").select("*, donations(*)").eq("ngo_id", user.id).order("claimed_at", { ascending: false }),
    ]);
    setAvailable((avail ?? []) as Donation[]);
    setClaims(my ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const claim = async (d: Donation) => {
    if (!user) return;
    if (!profile?.is_verified) return toast.error("Your NGO must be verified by an admin before claiming.");
    const { error } = await supabase.from("claims").insert({ donation_id: d.id, ngo_id: user.id });
    if (error) return toast.error(error.message);
    await supabase.from("donations").update({ status: "claimed" }).eq("id", d.id);
    await supabase.from("notifications").insert({ user_id: d.donor_id, message: `Your "${d.title}" was claimed`, type: "claim", link: `/donations/${d.id}` });
    toast.success("Claimed! A volunteer will be assigned soon.");
    load();
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Package} value={available.length} label="Available nearby" />
        <Stat icon={HandHeart} value={claims.length} label="My claims" />
        <Stat icon={MapPin} value={claims.filter((c: any) => c.status === "completed").length} label="Delivered to you" />
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">Available donations</h2>
        {loading ? (
          <div className="card-warm p-12 text-center text-muted-foreground">Loading…</div>
        ) : available.length === 0 ? (
          <div className="card-warm p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary-soft grid place-items-center"><Package className="h-6 w-6 text-primary" /></div>
            <p className="mt-4 font-medium">No donations nearby yet</p>
            <p className="text-sm text-muted-foreground">Check back soon — new listings appear in real time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((d) => (
              <div key={d.id} className="card-warm p-5 flex flex-col">
                <Badge variant="outline" className="capitalize self-start mb-3">{d.category}</Badge>
                <h3 className="font-display text-lg font-semibold">{d.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{d.quantity}</p>
                <p className="mt-3 text-sm flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />{d.pickup_address}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}</p>
                <Button onClick={() => claim(d)} className="mt-4 bg-warm-gradient text-primary-foreground hover:opacity-90">Claim</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">My claims</h2>
        {claims.length === 0 ? (
          <div className="card-warm p-8 text-center text-muted-foreground">You haven't claimed anything yet.</div>
        ) : (
          <div className="card-warm divide-y divide-border">
            {claims.map((c: any) => (
              <div key={c.id} className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.donations?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Claimed {formatDistanceToNow(new Date(c.claimed_at), { addSuffix: true })}</p>
                </div>
                <Badge className="capitalize">{c.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <SupportingDonors />
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Package; value: number; label: string }) {
  return (
    <div className="card-warm p-5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
