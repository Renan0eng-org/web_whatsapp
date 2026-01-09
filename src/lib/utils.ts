import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestampToDateTime(
  timestamp: string | number,
  locale: string = "en-US"
) {
  const date = new Date(Number(timestamp));
  return date.toLocaleString(locale, {
    // year: "numeric",
    // month: "2-digit",
    // day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Altere para false se preferir formato de 24 horas
  });
}

export function formatDate(date: string): string {
  // Converte a string para o formato ISO que o JavaScript entende
  const [day, month, yearAndTime] = date.split("/");
  const [year, time] = yearAndTime.split(", ");

  // Ajusta para o formato correto: yyyy-mm-ddTHH:mm:ss
  const isoDateString = `${year}-${month}-${day}T${time}`;

  const newData = new Date(isoDateString); // Cria o objeto Date
  const now = new Date();
  const diffInMs = now.getTime() - newData.getTime();
  const diffInDays = diffInMs / (1000 * 3600 * 24);

  // Caso seja o mesmo dia, apenas mostrar a hora
  if (diffInDays < 1) {
    return newData.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Caso seja ontem
  if (diffInDays < 2) {
    return "Ontem";
  }

  // Caso seja dentro da mesma semana
  if (diffInDays < 7) {
    return newData.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  // Caso seja mais de uma semana atrás, mostrar a data no formato dd/mm/yyyy
  return newData.toLocaleDateString("pt-BR");
}

export function truncateText(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  }
  return text;
}

export const formatDateMes = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(",", "."); // Adiciona o ponto ao final do mês
};

export const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];



import { LucideIcon } from "lucide-react";

type MenuAcesso = {
  id: number
  nome: string
  slug: string
  visualizar: boolean
  criar: boolean
  editar: boolean
  excluir: boolean
  relatorio: boolean
}

type MenuItem = {
  title: string
  url: string
}

type NavMenu = {
  title: string
  url: string
  icon: LucideIcon
  nivel_acesso: string
  items?: MenuItem[]
}

export function filtrarMenusPorAcesso(
  menus: NavMenu[],
  acessos: MenuAcesso[]
) {
  const slugsPermitidos = acessos
    .filter((a) => a.visualizar)
    .map((a) => a.slug)

  return menus
    // .filter((menu) => slugsPermitidos.includes(menu.nivel_acesso) || menu.nivel_acesso === "")
    .map((menu) => ({
      ...menu,
      items: menu.items,
    }))
}

export function parseOrderBy(sortBy: string, sortOrder: "asc" | "desc") {
  
  if (sortBy === "Produto_nome") {
    return { Produto: { nome: sortOrder } };
  }

  // Fallback para campos diretos do produtoMovimento
  return { [sortBy]: sortOrder };
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatarDataBrToIso(valor: Date | string): string {
  if (!valor) return "";

  let data: Date;

  if (typeof valor === "string") {
    // Assume formato "dd/mm/yyyy"
    const partes = valor.split("/");
    if (partes.length !== 3) throw new Error("Data inválida");

    // Ajusta para formato ISO (yyyy, mm-1, dd)
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // meses são 0-based no JS
    const ano = parseInt(partes[2], 10);

    data = new Date(ano, mes, dia);
  } else {
    data = valor;
  }

  if (isNaN(data.getTime())) {
    throw new Error("Data inválida");
  }

  return data.toISOString().split("T")[0];
}
