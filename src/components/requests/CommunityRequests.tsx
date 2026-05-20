import { useEffect, useState } from "react";
import { Check, X, MapPin, Phone, Inbox, Pill, UtensilsCrossed, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { getCategory, URGENCY_OPTIONS } from "@/lib/request-categories";

interface Row {
  id: string;
  requester_id: string;
  requester_name: string | null;
  category: string | null;
  urgency: string | null;
  contact_number: string | null;
  location_text: string | null;
  concern_details: string | null;
  photo_urls: string[] | null;
  claimed_at: string;
  status: string;
  responded_ngo_id: string | null;
  extras: Record<string, unknown> | null;
}

export function CommunityRequests() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [declined, setDeclined] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("vol_declined") ?? "[]"); } catch { return []; }
  });

  const persistDeclined = (next: string[]) => {
    setDeclined(next);
    localStorage.setItem("vol_declined", JSON.stringify(next));
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("claims")
      .select("id,requester_id,requester_name,category,urgency,contact_number,location_text,concern_details,photo_urls,claimed_at,status,responded_ngo_id,extras")
      .is("donation_id", null)
      .eq("status", "approved")
      .is("volunteer_id", null)
      .order("claimed_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("community-requests-volunteer")
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const accept = async (r: Row) => {
    if (!user) return;
    if (!profile?.is_verified) return toast.error("Verification pending — admin will approve you soon.");
    setActing(r.id);
    const { error } = await supabase
      .from("claims")
      .update({ volunteer_id: user.id, status: "in_transit" } as never)
      .eq("id", r.id);
    if (error) { setActing(null); return toast.error(error.message); }

    // Notify requester + NGO
    const inserts: any[] = [
      {
        user_id: r.requester_id,
        type: "volunteer_assigned",
        title: "🚴 Volunteer on the way!",
        message: `${profile?.name ?? "A volunteer"} has accepted your request and will help shortly.`,
        related_claim_id: r.id,
        link: "/dashboard",
      },
    ];
    if (r.responded_ngo_id) {
      inserts.push({
        user_id: r.responded_ngo_id,
        type: "volunteer_assigned",
        title: "Volunteer assigned",
        message: `${profile?.name ?? "A volunteer"} accepted the ${getCategory(r.category)?.label ?? ""} task.`,
        related_claim_id: r.id,
        link: "/dashboard",
      });
    }
    await supabase.from("notifications").insert(inserts as never);

    toast.success("Task accepted — thank you!");
    setActing(null);
    load();
  };

  const decline = (r: Row) => {
    persistDeclined([...declined, r.id]);
    toast.message("Hidden from your list");
  };

  const visible = rows.filter((r) => !declined.includes(r.id));

  if (loading) {
    return <div className="card-warm p-12 text-center text-muted-foreground">Loading community requests…</div>;
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Community Requests</h2>
          <p className="text-sm text-muted-foreground">Requests approved by NGOs and waiting for a volunteer.</p>
        </div>
        <Badge variant="outline">{visible.length} open</Badge>
      </div>

      {visible.length === 0 ? (
        <div className="card-warm p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary-soft grid place-items-center">
            <Inbox className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 font-medium">No community tasks right now</p>
          <p className="text-sm text-muted-foreground">You'll see new ones here as soon as an NGO accepts them.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r) => {
            const cat = getCategory(r.category);
            const Icon = cat?.icon;
            const urg = URGENCY_OPTIONS.find((u) => u.value === r.urgency);
            const extras = (r.extras ?? {}) as Record<string, any>;
            return (
              <div key={r.id} className="card-warm p-5 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {Icon && <span className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${cat?.gradient}`}><Icon className={`h-4 w-4 ${cat?.iconColor}`} /></span>}
                    <span className="text-sm font-medium">{cat?.label ?? r.category}</span>
                  </div>
                  {urg && <Badge className={`${urg.color} border capitalize`}>{urg.label}</Badge>}
                </div>
                <h3 className="font-display text-lg font-semibold mt-3">{r.requester_name ?? "Anonymous"}</h3>
                {r.location_text && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{r.location_text}
                  </p>
                )}
                {r.contact_number && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />{r.contact_number}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">{r.concern_details}</p>

                {/* Category specific details */}
                {extras.medicine_expiry_date && (
                  <p className="text-xs mt-2 flex items-center gap-1.5 text-sky-700">
                    <Pill className="h-3.5 w-3.5" />Medicine expires: {format(new Date(extras.medicine_expiry_date), "PP")}
                  </p>
                )}
                {(extras.food_prepared_at || extras.food_expires_at || extras.people_count) && (
                  <div className="text-xs mt-2 space-y-0.5 text-orange-700">
                    {extras.food_prepared_at && <p className="flex items-center gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" />Prepared: {format(new Date(extras.food_prepared_at), "PPp")}</p>}
                    {extras.food_expires_at && <p className="flex items-center gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" />Expires: {format(new Date(extras.food_expires_at), "PPp")}</p>}
                    {extras.people_count && <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />For ~{extras.people_count} people</p>}
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(r.claimed_at), { addSuffix: true })}</p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={acting === r.id} onClick={() => accept(r)}>
                    <Check className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => decline(r)}>
                    <X className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
