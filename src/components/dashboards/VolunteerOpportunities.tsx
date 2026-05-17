import { MapPin, Package, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TASKS = [
  { name: "Meena Joshi", city: "Nagpur", task: "Needs help delivering food boxes every Sunday", items: "20 meal kits" },
  { name: "Vikram Nair", city: "Kochi", task: "Surplus groceries to be picked up and redistributed", items: "Vegetables & grains" },
  { name: "Rina Das", city: "Kolkata", task: "Weekly clothing and food bundle drive", items: "Mixed" },
  { name: "Arjun Kapoor", city: "Jaipur", task: "Restaurant owner donating leftover food nightly", items: "Cooked meals" },
  { name: "Deepa Iyer", city: "Coimbatore", task: "Home baker donating bread and snacks on weekends", items: "Baked goods" },
];

export function VolunteerOpportunities() {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold mb-4">Donors you can assist</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TASKS.map((t) => (
          <div key={t.name} className="card-warm p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{t.city}
                </p>
              </div>
              <Badge className="bg-amber/20 text-amber-foreground border border-amber/40">Volunteer</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{t.task}</p>
            <p className="mt-3 text-sm flex items-center gap-1.5">
              <Package className="h-4 w-4 text-secondary" />
              <span className="font-medium">{t.items}</span>
            </p>
            <Button
              onClick={() => toast.success(`You signed up to help ${t.name}!`)}
              className="mt-4 bg-amber text-amber-foreground hover:opacity-90"
            >
              <Bike className="h-4 w-4 mr-1.5" />Volunteer
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
