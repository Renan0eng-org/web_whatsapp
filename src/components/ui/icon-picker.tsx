"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertCircle,
    Banknote,
    BarChart3,
    Book,
    Briefcase,
    Car,
    CheckCircle,
    Coffee,
    Coins,
    CreditCard,
    DollarSign,
    Droplet,
    FileText,
    Fuel,
    Gift,
    Heart,
    Home,
    MessagesSquare,
    MoreHorizontal,
    Package,
    Phone,
    PieChart,
    PiggyBank,
    Pill,
    Plane,
    Receipt,
    Shield,
    ShoppingCart,
    Stethoscope,
    Ticket,
    TrendingDown,
    TrendingUp,
    Utensils,
    Wallet,
    Wifi,
    Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type IconPickerProps = {
  value?: string;
  onChange: (name: string) => void;
  presets?: string[];
  className?: string;
};

const DEFAULT_ICON_MAP = {
  Home,
  MessagesSquare,
  Shield,
  Wallet,
  ShoppingCart,
  CreditCard,
  Car,
  Utensils,
  Heart,
  Book,
  Phone,
  FileText,
  TrendingUp,
  MoreHorizontal,
  PiggyBank,
  Banknote,
  DollarSign,
  Coins,
  Receipt,
  PieChart,
  BarChart3,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Coffee,
  Fuel,
  Zap,
  Droplet,
  Wifi,
  Package,
  Gift,
  Pill,
  Stethoscope,
  Briefcase,
  Plane,
  Ticket,
} as const;

const DEFAULT_PRESETS = Object.keys(DEFAULT_ICON_MAP);

function getIconComponent(name?: string) {
  if (!name) return null;
  return (DEFAULT_ICON_MAP as Record<string, any>)[name] || null;
}

export function IconPicker({ value, onChange, presets = DEFAULT_PRESETS, className }: IconPickerProps) {
  const [custom, setCustom] = useState(value || "");
  const IconComp = useMemo(() => getIconComponent(custom || value || undefined), [custom, value]);

  const handlePreset = (v: string) => {
    setCustom(v);
    onChange(v);
  };

  const handleCustom = (v: string) => {
    setCustom(v);
    onChange(v);
  };

  return (
    <div className={className}>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm">Selecionar ícone</Label>
            <Select value={custom || value || ""} onValueChange={handlePreset}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um ícone" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((name) => {
                  const Cmp = getIconComponent(name);
                  return (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {Cmp && <Cmp className="h-4 w-4" />}
                        {name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Ou por texto</Label>
            <Input
              value={custom}
              onChange={(e) => handleCustom(e.target.value)}
              placeholder="ex: ShoppingCart"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default IconPicker;
