import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Package, Heart, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { NGOSuggestions } from "./NGOSuggestions";

interface Donation {
  id: string;
  title: string;
  category: string;
  status: string;
  quantity: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  available: "bg-secondary/20 text-secondary-foreground border-secondary/40",
  claimed: "bg-amber/20 text-amber-foreground border-amber/40",
  in_transit: "bg-info/20 text-foreground border-info/40",
  completed: "bg-primary/20 text-primary border-primary/40",
  expired: "bg-muted text-muted-foreground border-border",
};

export function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("donations").select("id,title,category,status,quantity,created_at")
      .eq("donor_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setDonations(data ?? []); setLoading(false); });
  }, [user]);

  const active = donations.filter(d => d.status === "available" || d.status === "claimed" || d.status === "in_transit").length;
  const completed = donations.filter(d => d.status === "completed").length;

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total donations" value={donations.length} />
        <StatCard icon={Sparkles} label="Active listings" value={active} />
        <StatCard icon={Heart} label="Lives impacted" value={completed * 4} hint="estimated" />
        <StatCard icon={Clock} label="Completed" value={completed} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">My donations</h2>
        <Button asChild className="bg-warm-gradient text-primary-foreground hover:opacity-90">
          <Link to="/donate/new"><Plus className="h-4 w-4 mr-1.5" />Post donation</Link>
        </Button>
      </div>

      <div className="card-warm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary-soft grid place-items-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 font-medium">No donations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Post your first surplus item and start making impact.</p>
            <Button asChild className="mt-5 bg-warm-gradient text-primary-foreground hover:opacity-90">
              <Link to="/donate/new"><Plus className="h-4 w-4 mr-1.5" />Post your first donation</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {donations.map((d) => (
              <li key={d.id} className="p-5 flex flex-wrap items-center gap-4 justify-between hover:bg-accent/30 transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{d.title}</h3>
                    <Badge variant="outline" className="capitalize">{d.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {d.quantity} · {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge className={`${statusColor[d.status]} border capitalize`}>{d.status.replace("_", " ")}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NGOSuggestions />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Package; label: string; value: number; hint?: string }) {
  return (
    <div className="card-warm p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}{hint && <span className="text-xs ml-1 opacity-70">({hint})</span>}</p>
    </div>
  );
}
