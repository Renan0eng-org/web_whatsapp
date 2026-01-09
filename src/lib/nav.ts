import {
  Home,
  MessagesSquare,
  Shield
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
    // /admin/whatsapp
    {
      title: "WhatsApp",
      url: "/admin/whatsapp",
      icon: MessagesSquare,
      isActive: false,
      nivel_acesso: "",
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
