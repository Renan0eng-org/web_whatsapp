"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePickerSingle({
  className,
  value,
  onChange,
  label,
}: {
  className?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  label?: string
}) {
  const [open, setOpen] = React.useState(false)

  const displayValue = value
    ? format(value, "dd/MM/yyyy", { locale: ptBR })
    : "Selecione uma data"

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label htmlFor="date" className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal border-input-border bg-input-background",
              value && "text-text"
            )}
          >
            <span>{displayValue}</span>
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
