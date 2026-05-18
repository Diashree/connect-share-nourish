import { useEffect, useState } from "react";
import { Check, X, MapPin, Phone, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getCategory, URGENCY_OPTIONS } from "@/lib/request-categories";

interface RequestRow {
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
}

export function IncomingRequests() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<RequestRow | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("claims")
      .select("id,requester_id,requester_name,category,urgency,contact_number,location_text,concern_details,photo_urls,claimed_at,status")
      .is("donation_id", null)
      .eq("status", "pending")
      .order("claimed_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as RequestRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("incoming-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (row: RequestRow, accept: boolean) => {
    if (!user) return;
    setActing(row.id);
    const newStatus = accept ? "approved" : "rejected";
    const { error } = await supabase
      .from("claims")
      .update({ status: newStatus, responded_ngo_id: user.id } as never)
      .eq("id", row.id);
    if (error) { setActing(null); return toast.error(error.message); }

    const cat = getCategory(row.category)?.label ?? "your";
    const ngoName = profile?.org_name || profile?.name || "An NGO";
    await supabase.from("notifications").insert({
      user_id: row.requester_id,
      type: accept ? "request_accepted" : "request_rejected",
      title: accept ? "✅ Request Accepted!" : "Request update",
      message: accept
        ? `${ngoName} has accepted your ${cat} request. Tap to view NGO details.`
        : `${ngoName} could not take up your ${cat} request.`,
      related_claim_id: row.id,
      ngo_id: user.id,
      link: "/dashboard",
    } as never);

    toast.success(accept ? "Request accepted" : "Request rejected");
    setActing(null);
    setActive(null);
    load();
  };

  if (loading) {
    return <div className="card-warm p-12 text-center text-muted-foreground">Loading incoming requests…</div>;
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Incoming Requests</h2>
          <p className="text-sm text-muted-foreground">Community help requests waiting for an NGO.</p>
        </div>
        <Badge variant="outline">{rows.length} pending</Badge>
      </div>

      {rows.length === 0 ? (
        <div className="card-warm p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary-soft grid place-items-center">
            <Inbox className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-4 font-medium">No pending requests right now</p>
          <p className="text-sm text-muted-foreground">You'll see new community requests here in real time.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => {
            const cat = getCategory(r.category);
            const Icon = cat?.icon;
            const urg = URGENCY_OPTIONS.find((u) => u.value === r.urgency);
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
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">{r.concern_details}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(r.claimed_at), { addSuffix: true })}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setActive(r)}>Details</Button>
                  <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={acting === r.id} onClick={() => respond(r, true)}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="destructive" disabled={acting === r.id} onClick={() => respond(r, false)}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {active && (() => {
            const cat = getCategory(active.category);
            const Icon = cat?.icon;
            const urg = URGENCY_OPTIONS.find((u) => u.value === active.urgency);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl flex items-center gap-2">
                    {Icon && <Icon className={`h-5 w-5 ${cat?.iconColor}`} />}
                    {cat?.label} request
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{active.requester_name}</span>
                    {urg && <Badge className={`${urg.color} border capitalize`}>{urg.label}</Badge>}
                  </div>
                  {active.location_text && <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="h-4 w-4 mt-0.5" />{active.location_text}</p>}
                  {active.contact_number && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{active.contact_number}</p>}
                  <div className="rounded-lg bg-muted/40 p-3 whitespace-pre-wrap">{active.concern_details}</div>
                  {active.photo_urls && active.photo_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {active.photo_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="block aspect-square rounded-md overflow-hidden border border-border">
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={acting === active.id} onClick={() => respond(active, true)}>
                      {acting === active.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />} Accept
                    </Button>
                    <Button variant="destructive" disabled={acting === active.id} onClick={() => respond(active, false)}>
                      <X className="h-4 w-4 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
}
