import { useEffect, useState } from "react";
import { ShieldCheck, Users, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AdminDashboard() {
  const [pending, setPending] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, donations: 0, completed: 0 });

  const load = async () => {
    const [{ data: pend }, { count: u }, { count: d }, { count: c }] = await Promise.all([
      supabase.from("profiles").select("id,name,org_name,bio,created_at, user_roles!inner(role)").eq("is_verified", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("donations").select("*", { count: "exact", head: true }),
      supabase.from("donations").select("*", { count: "exact", head: true }).eq("status", "completed"),
    ]);
    const verifiable = (pend ?? []).filter((p: any) =>
      Array.isArray(p.user_roles) && p.user_roles.some((r: any) => r.role === "ngo" || r.role === "volunteer")
    );
    setPending(verifiable);
    setStats({ users: u ?? 0, donations: d ?? 0, completed: c ?? 0 });
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("profiles").update({ is_verified: true }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({ user_id: id, message: "Your account has been verified! 🎉", type: "verified" });
    toast.success("Approved");
    load();
  };

  const reject = async (id: string) => {
    // soft "reject" — leave unverified; could be extended
    await supabase.from("notifications").insert({ user_id: id, message: "Your verification request needs more info.", type: "rejected" });
    toast.info("Sent rejection notice");
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Users} value={stats.users} label="Total users" />
        <Stat icon={Package} value={stats.donations} label="Total donations" />
        <Stat icon={ShieldCheck} value={stats.completed} label="Completed" />
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">Pending verifications</h2>
        {pending.length === 0 ? (
          <div className="card-warm p-12 text-center text-muted-foreground">Nothing pending. All clear ✨</div>
        ) : (
          <div className="card-warm divide-y divide-border">
            {pending.map((p) => (
              <div key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{p.org_name || p.name}</p>
                    <Badge variant="outline" className="capitalize">{p.user_roles[0]?.role}</Badge>
                  </div>
                  {p.bio && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{p.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => reject(p.id)}><X className="h-4 w-4 mr-1" />Reject</Button>
                  <Button size="sm" onClick={() => approve(p.id)} className="bg-warm-gradient text-primary-foreground hover:opacity-90">
                    <ShieldCheck className="h-4 w-4 mr-1" />Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <div className="card-warm p-5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
