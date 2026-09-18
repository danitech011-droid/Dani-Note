import { FileCog, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MARGINS,
  PAGE_SIZES,
  type MarginKey,
  type Orientation,
  type PageSetup,
  type PageSizeKey,
} from "@/lib/page-setup";

export function PageSetupMenu({
  setup,
  onChange,
  disabled,
}: {
  setup: PageSetup;
  onChange: (next: PageSetup) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <FileCog className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Page</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Paper size
          </Label>
          <Select
            value={setup.size}
            onValueChange={(v) => onChange({ ...setup, size: v as PageSizeKey })}
          >
            <SelectTrigger className="h-9" aria-label="Paper size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PAGE_SIZES[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Margins
          </Label>
          <Select
            value={setup.margin}
            onValueChange={(v) => onChange({ ...setup, margin: v as MarginKey })}
          >
            <SelectTrigger className="h-9" aria-label="Margins">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MARGINS) as MarginKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {MARGINS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Orientation
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "portrait", label: "Portrait", icon: RectangleVertical },
                { value: "landscape", label: "Landscape", icon: RectangleHorizontal },
              ] as { value: Orientation; label: string; icon: typeof RectangleVertical }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...setup, orientation: opt.value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-all",
                  setup.orientation === opt.value
                    ? "border-primary bg-accent text-accent-foreground shadow-soft"
                    : "border-border hover:bg-accent/60",
                )}
              >
                <opt.icon className="h-5 w-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
