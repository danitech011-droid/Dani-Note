import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ShareDialog({
  open,
  onOpenChange,
  shareToken,
  shareRole,
  onShareChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shareToken: string;
  shareRole: string;
  onShareChange: (role: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/share/${shareToken}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Share document
          </DialogTitle>
          <DialogDescription>
            Choose who can access this document through a link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select
            value={shareRole}
            disabled={saving}
            onValueChange={async (v) => {
              setSaving(true);
              try {
                await onShareChange(v);
                toast.success("Sharing updated");
              } catch {
                toast.error("Could not update sharing");
              } finally {
                setSaving(false);
              }
            }}
          >
            <SelectTrigger aria-label="Link permission">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Private — only me</SelectItem>
              <SelectItem value="viewer">Anyone with the link can view</SelectItem>
              <SelectItem value="editor">Anyone with the link can edit</SelectItem>
            </SelectContent>
          </Select>

          {shareRole !== "none" && (
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Share link" />
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(link);
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
