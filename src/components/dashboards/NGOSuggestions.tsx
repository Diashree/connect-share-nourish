import { MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NGOS = [
  { name: "Asha Foundation", city: "New Delhi", desc: "Provides mid-day meals to 500+ school children daily.", category: "Food" },
  { name: "Green Hands NGO", city: "Mumbai", desc: "Distributes surplus food from restaurants to shelters.", category: "Food" },
  { name: "Hope Kitchen", city: "Bangalore", desc: "Runs community kitchens in urban slums.", category: "Food & Health" },
  { name: "Nourish India", city: "Hyderabad", desc: "Connects farmers with urban food banks.", category: "Food" },
  { name: "Seva Meals", city: "Chennai", desc: "Weekly food drives for elderly and disabled citizens.", category: "Food" },
];

export function NGOSuggestions() {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold mb-4">NGOs you can donate to</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NGOS.map((n) => (
          <div key={n.name} className="card-warm p-5 flex flex-col">
            <Badge variant="outline" className="self-start mb-3 bg-primary-soft text-primary border-primary/30">{n.category}</Badge>
            <h3 className="font-display text-lg font-semibold">{n.name}</h3>
            <p className="mt-1 text-sm flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />{n.city}
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{n.desc}</p>
            <Button
              onClick={() => toast.success(`Thanks for choosing ${n.name}! Opening donation flow…`)}
              className="mt-4 bg-warm-gradient text-primary-foreground hover:opacity-90"
            >
              <Heart className="h-4 w-4 mr-1.5" />Donate
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
