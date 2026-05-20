import { useState } from "react";
import { Loader2, MapPin, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { type RequestCategory, URGENCY_OPTIONS } from "@/lib/request-categories";

interface Props {
  category: RequestCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_PHOTOS = 5;

export function RequestModal({ category, open, onOpenChange }: Props) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState<string>("medium");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  // Category-specific
  const [medicineExpiry, setMedicineExpiry] = useState("");
  const [foodPreparedAt, setFoodPreparedAt] = useState("");
  const [foodExpiresAt, setFoodExpiresAt] = useState("");
  const [peopleCount, setPeopleCount] = useState("");

  if (!category) return null;
  const Icon = category.icon;

  const reset = () => {
    setName(""); setPhone(""); setAddress(""); setLat(null); setLng(null);
    setDetails(""); setUrgency("medium"); setPhotos([]);
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return toast.error("Geolocation not available");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude); setLng(pos.coords.longitude);
        setAddress((a) => a || `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
        toast.success("Location captured");
      },
      (err) => { setLocating(false); toast.error(err.message); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    const next = [...photos, ...list].slice(0, MAX_PHOTOS);
    setPhotos(next);
    e.target.value = "";
  };

  const submit = async () => {
    if (!user) return toast.error("Please sign in to raise a request");
    if (!name.trim() || !phone.trim() || !address.trim() || !details.trim()) {
      return toast.error("Please fill all required fields");
    }
    setSubmitting(true);
    try {
      // Upload photos
      const photo_urls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("request-photos").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("request-photos").getPublicUrl(path);
        photo_urls.push(pub.publicUrl);
      }

      // Insert claim
      const { data: claim, error: insErr } = await supabase.from("claims").insert({
        requester_id: user.id,
        requester_name: name.trim(),
        request_title: `${category.label} request`,
        category: category.key,
        urgency,
        contact_number: phone.trim(),
        location_text: address.trim(),
        latitude: lat,
        longitude: lng,
        photo_urls,
        concern_details: details.trim(),
        status: "pending",
      } as never).select("id").single();
      if (insErr) throw insErr;

      // Fan-out notifications to all NGOs
      const { data: ngoRoles } = await supabase.from("user_roles").select("user_id").eq("role", "ngo");
      const ngoIds = (ngoRoles ?? []).map((r) => r.user_id);
      if (ngoIds.length > 0 && claim) {
        await supabase.from("notifications").insert(
          ngoIds.map((uid) => ({
            user_id: uid,
            type: "new_request",
            title: `New ${category.label} request`,
            message: `${name.trim()} raised a ${urgency} ${category.label.toLowerCase()} request.`,
            related_claim_id: claim.id,
            link: "/dashboard",
          })) as never,
        );
      }

      toast.success("Your request has been sent to all partner NGOs!");
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  // Prefill name from profile once
  if (open && !name && profile?.name) setName(profile.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${category.gradient}`}>
              <Icon className={`h-5 w-5 ${category.iconColor}`} />
            </span>
            <div>
              <DialogTitle className="font-display text-xl">{category.label} Request Form</DialogTitle>
              <DialogDescription>Share the details — verified NGOs will be notified instantly.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Field label="Full Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
          </Field>

          <Field label="Contact Number *">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" maxLength={20} />
          </Field>

          <Field label="Address / Location *">
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" rows={2} maxLength={500} />
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={useMyLocation} disabled={locating}>
              {locating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-1.5" />}
              Use my location
            </Button>
            {lat !== null && lng !== null && (
              <p className="text-xs text-muted-foreground mt-1">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</p>
            )}
          </Field>

          <Field label={`Upload Photos (max ${MAX_PHOTOS})`}>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/40 transition">
              <Upload className="h-4 w-4" />
              <span>Click to upload</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} disabled={photos.length >= MAX_PHOTOS} />
            </label>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((f, i) => (
                  <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label={`${category.detailsLabel} *`}>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={category.detailsPlaceholder} rows={4} maxLength={1500} />
          </Field>

          <Field label="Urgency Level">
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Category">
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 py-2">
              <Icon className={`h-4 w-4 ${category.iconColor}`} />
              <span className="text-sm">{category.label}</span>
              <Badge variant="outline" className="ml-auto text-xs">auto</Badge>
            </div>
          </Field>

          <Button onClick={submit} disabled={submitting} className="w-full bg-warm-gradient text-primary-foreground hover:opacity-90 h-11">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</> : "Send Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
