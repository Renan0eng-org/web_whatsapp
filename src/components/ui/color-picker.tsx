"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useRef, useState } from "react";

type ColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
  disabled?: boolean;
  className?: string;
  showHexInline?: boolean;
};

const DEFAULT_PRESETS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#96CEB4", // green
  "#FFEAA7", // yellow
  "#DDA0DD", // purple
  "#87CEEB", // sky
  "#CD5C5C", // rose
  "#708090", // slate
  "#90EE90", // light-green
  "#FFD700", // gold
  "#808080", // gray
];

function normalizeHex(hex: string): string {
  let h = (hex || "").trim();
  if (!h) return "";
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    // expand #abc -> #aabbcc
    const r = h[1];
    const g = h[2];
    const b = h[3];
    h = `#${r}${r}${g}${g}${b}${b}`;
  }
  return h.toUpperCase();
}

function isValidHex(hex: string): boolean {
  return /^#([0-9A-F]{6})$/i.test(hex);
}

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  disabled,
  className,
  showHexInline = true,
}: ColorPickerProps) {
  const current = useMemo(() => normalizeHex(value || "#808080"), [value]);
  const [draftHex, setDraftHex] = useState(current);
  const commitTimer = useRef<number | null>(null);

  const applyHex = (hex: string, opts?: { immediate?: boolean }) => {
    const norm = normalizeHex(hex);
    // always reflect instantly in UI
    setDraftHex(norm);

    if (!isValidHex(norm)) return;

    if (opts?.immediate) {
      onChange(norm);
      return;
    }

    // throttle parent updates to avoid lag while dragging
    if (commitTimer.current) {
      window.clearTimeout(commitTimer.current);
    }
    commitTimer.current = window.setTimeout(() => {
      onChange(norm);
      commitTimer.current = null;
    }, 60);
  };

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} className="gap-2">
            <span
              aria-label="Cor selecionada"
              className="inline-block h-4 w-4 rounded-full border"
              style={{ backgroundColor: draftHex || current }}
            />
            {showHexInline && (
              <span className="text-xs text-muted-foreground">{draftHex || current}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3" align="start">
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2">
              {presets.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-label={c}
                  onClick={() => applyHex(c, { immediate: true })}
                  className="h-6 w-6 rounded border hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Código HEX</label>
            <Input
              value={draftHex}
              onChange={(e) => setDraftHex(e.target.value)}
              onBlur={() => applyHex(draftHex, { immediate: true })}
              placeholder="#808080"
            />
            {!isValidHex(draftHex) && (
              <p className="text-[10px] text-destructive">Use o formato #RRGGBB</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Seletor nativo</label>
            <input
              aria-label="Selecionar cor"
              type="color"
              value={draftHex || current}
              onInput={(e) => applyHex((e.target as HTMLInputElement).value)}
              className="h-8 w-full cursor-pointer rounded border bg-transparent p-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ColorPicker;
