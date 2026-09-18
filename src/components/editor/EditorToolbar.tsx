import { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Highlighter,
  Baseline,
  RemoveFormatting,
  Plus,
  Indent,
  Outdent,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const FONTS = [
  "Plus Jakarta Sans",
  "Sora",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Courier New",
  "Verdana",
];
const SIZES = ["12", "14", "16", "18", "20", "24", "30", "36"];
const COLORS = [
  "#0f172a",
  "#1e1b4b",
  "#4338ca",
  "#7c3aed",
  "#0f766e",
  "#047857",
  "#b45309",
  "#be123c",
  "#db2777",
  "#475569",
];
const HIGHLIGHTS = [
  "#ede9fe",
  "#dbeafe",
  "#cffafe",
  "#dcfce7",
  "#fef9c3",
  "#ffedd5",
  "#fee2e2",
  "#fce7f3",
  "#e2e8f0",
  "transparent",
];

export type ToolbarProps = {
  exec: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onInsertImage: () => void;
  onInsertTable: () => void;
};

type Mark =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull";

const MARKS: Mark[] = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "insertUnorderedList",
  "insertOrderedList",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "justifyFull",
];

const EMPTY_MARKS = MARKS.reduce(
  (acc, m) => ({ ...acc, [m]: false }),
  {} as Record<Mark, boolean>,
);

function useActiveMarks(): Record<Mark, boolean> {
  const [marks, setMarks] = useState<Record<Mark, boolean>>(EMPTY_MARKS);

  const sync = useCallback(() => {
    if (typeof document === "undefined") return;
    setMarks(
      MARKS.reduce((acc, m) => {
        let state = false;
        try {
          state = document.queryCommandState(m);
        } catch {
          state = false;
        }
        return { ...acc, [m]: state };
      }, {} as Record<Mark, boolean>),
    );
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, [sync]);

  return marks;
}

function Tool({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200",
            "hover:bg-accent hover:text-foreground active:scale-95",
            active &&
              "bg-brand-gradient text-primary-foreground shadow-brand hover:text-primary-foreground",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-xl bg-muted/50 p-0.5">{children}</div>
  );
}

export function EditorToolbar({ exec, onInsertLink, onInsertImage, onInsertTable }: ToolbarProps) {
  const marks = useActiveMarks();

  return (
    <TooltipProvider delayDuration={250}>
      <div className="relative rounded-2xl hairline bg-card/85 shadow-soft backdrop-blur">
        <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Group>
            <Tool label="Undo" onClick={() => exec("undo")}>
              <Undo2 className="h-4 w-4" />
            </Tool>
            <Tool label="Redo" onClick={() => exec("redo")}>
              <Redo2 className="h-4 w-4" />
            </Tool>
          </Group>

          <Select onValueChange={(v) => exec("formatBlock", v)}>
            <SelectTrigger
              className="h-9 w-[124px] shrink-0 rounded-xl border-border/60 bg-muted/40 text-xs font-medium"
              aria-label="Paragraph style"
            >
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Normal text</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="blockquote">Quote</SelectItem>
              <SelectItem value="pre">Code block</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => exec("fontName", v)}>
            <SelectTrigger
              className="hidden h-9 w-[136px] shrink-0 rounded-xl border-border/60 bg-muted/40 text-xs font-medium sm:flex"
              aria-label="Font"
            >
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(v) => {
              exec("fontSize", "7");
              exec("__pxSize", v);
            }}
          >
            <SelectTrigger
              className="h-9 w-[78px] shrink-0 rounded-xl border-border/60 bg-muted/40 text-xs font-medium"
              aria-label="Font size"
            >
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Group>
            <Tool label="Bold" active={marks.bold} onClick={() => exec("bold")}>
              <Bold className="h-4 w-4" />
            </Tool>
            <Tool label="Italic" active={marks.italic} onClick={() => exec("italic")}>
              <Italic className="h-4 w-4" />
            </Tool>
            <Tool label="Underline" active={marks.underline} onClick={() => exec("underline")}>
              <Underline className="h-4 w-4" />
            </Tool>
            <Tool
              label="Strikethrough"
              active={marks.strikeThrough}
              onClick={() => exec("strikeThrough")}
            >
              <Strikethrough className="h-4 w-4" />
            </Tool>
          </Group>

          <Group>
            <ColorPicker
              icon={<Baseline className="h-4 w-4" />}
              label="Text colour"
              colors={COLORS}
              onPick={(c) => exec("foreColor", c)}
            />
            <ColorPicker
              icon={<Highlighter className="h-4 w-4" />}
              label="Highlight"
              colors={HIGHLIGHTS}
              onPick={(c) => exec("hiliteColor", c)}
            />
          </Group>

          <Group>
            <Tool
              label="Bullet list"
              active={marks.insertUnorderedList}
              onClick={() => exec("insertUnorderedList")}
            >
              <List className="h-4 w-4" />
            </Tool>
            <Tool
              label="Numbered list"
              active={marks.insertOrderedList}
              onClick={() => exec("insertOrderedList")}
            >
              <ListOrdered className="h-4 w-4" />
            </Tool>
            <Tool label="Decrease indent" onClick={() => exec("outdent")}>
              <Outdent className="h-4 w-4" />
            </Tool>
            <Tool label="Increase indent" onClick={() => exec("indent")}>
              <Indent className="h-4 w-4" />
            </Tool>
          </Group>

          <Group>
            <Tool label="Align left" active={marks.justifyLeft} onClick={() => exec("justifyLeft")}>
              <AlignLeft className="h-4 w-4" />
            </Tool>
            <Tool
              label="Align center"
              active={marks.justifyCenter}
              onClick={() => exec("justifyCenter")}
            >
              <AlignCenter className="h-4 w-4" />
            </Tool>
            <Tool
              label="Align right"
              active={marks.justifyRight}
              onClick={() => exec("justifyRight")}
            >
              <AlignRight className="h-4 w-4" />
            </Tool>
            <Tool label="Justify" active={marks.justifyFull} onClick={() => exec("justifyFull")}>
              <AlignJustify className="h-4 w-4" />
            </Tool>
          </Group>

          <Group>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Insert"
                      onMouseDown={(e) => e.preventDefault()}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden lg:inline">Insert</span>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent sideOffset={6} className="text-xs">
                  Insert
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onInsertLink}>
                  <Link2 className="mr-2 h-4 w-4" /> Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onInsertImage}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onInsertTable}>
                  <TableIcon className="mr-2 h-4 w-4" /> Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exec("insertHorizontalRule")}>
                  <Minus className="mr-2 h-4 w-4" /> Divider
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exec("formatBlock", "blockquote")}>
                  <Quote className="mr-2 h-4 w-4" /> Quote
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tool label="Clear formatting" onClick={() => exec("removeFormat")}>
              <RemoveFormatting className="h-4 w-4" />
            </Tool>
          </Group>
        </div>
        <div className="pointer-events-none absolute inset-y-1 right-0 w-8 rounded-r-2xl bg-gradient-to-l from-card to-transparent sm:hidden" />
      </div>
    </TooltipProvider>
  );
}

function ColorPicker({
  icon,
  label,
  colors,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  colors: string[];
  onPick: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              onMouseDown={(e) => e.preventDefault()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95"
            >
              {icon}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6} className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto rounded-2xl p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`${label} ${c}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-110"
              style={{
                background:
                  c === "transparent"
                    ? "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 6px 6px"
                    : c,
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
