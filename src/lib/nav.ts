import {
  BadgeDollarSign,
  Home,
  MessagesSquare,
  Shield,
  Wallet
} from "lucide-react";

export const data = {
  user: {
    name: "Ícarus",
    email: "icarus@example.com",
    avatar: "/logo.webp"
  },
  
  navMain: [
    {
      title: "Home",
      url: "/admin",
      icon: Home,
      isActive: false,
      nivel_acesso: "",
    },
    {
      title: "Controle de Acesso",
      url: "/admin/acessos",
      icon: Shield,
      isActive: false,
      nivel_acesso: "acesso",
    },
    {
      title: "WhatsApp",
      url: "/admin/whatsapp",
      icon: MessagesSquare,
      isActive: false,
      nivel_acesso: "",
    },
    {
      title: "Empréstimos",
      url: "/admin/emprestimos",
      icon: BadgeDollarSign,
      isActive: false,
      nivel_acesso: "",
    },
    {
      title: "Finanças",
      url: "/admin/financas",
      icon: Wallet,
      isActive: false,
      nivel_acesso: "",
      items: [
        {
          title: "Categorias",
          url: "/admin/financas/categorias",
        },
        {
          title: "Importar Extrato",
          url: "/admin/financas/importar",
        },
        {
          title: "Classificar Despesas",
          url: "/admin/financas/classificar",
        },
        {
          title: "Gastos Previstos",
          url: "/admin/financas/gastos",
        },
        {
          title: "Movimentações",
          url: "/admin/financas/movements",
        },
        {
          title: "Lixeira",
          url: "/admin/financas/lixeira",
        },
      ],
    },
  ],
  flow: [
    // {
    //   title: "Chegada Alevinos",
    //   url: "/admin/chegada/alevinos",
    //   icon: Fish,
    //   isActive: false,
    //   nivel_acesso: "chegada-alevinos",
    // },
    // {
    //   title: "Trato",
    //   url: "/admin/trato",
    //   icon: Ham,
    //   isActive: false,
    //   nivel_acesso: "trato",
    // },
  ],
};
