"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { DateRange } from "react-day-picker"

export function DateRangePicker({
  className,
  value,
  onChange,
  label,
}: {
  className?: string
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  label?: string
}) {
  const [open, setOpen] = React.useState(false)

  const displayValue =
    value?.from && value?.to
      ? `${format(value.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(value.to, "dd/MM/yyyy", { locale: ptBR })}`
      : value?.from
      ? format(value.from, "dd/MM/yyyy", { locale: ptBR })
      : "Selecione o intervalo"

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <label htmlFor="date" className="text-sm font-medium text-muted-foreground">
        {label}
      </label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal border-input-border bg-input-background",
                        value?.from && "text-text")}
          >
            <span>{displayValue}</span>
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
