# Frontend - Sistema de Autenticação e Controle de Níveis

Interface moderna em Next.js com Tailwind CSS para autenticação de usuários, dashboard e painel administrativo.

## 📋 Requisitos

- Node.js 18+
- npm ou yarn

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar o servidor em desenvolvimento
npm run dev

# Acessar em http://localhost:3000
```

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia com hot reload (porta 3000)

# Build
npm run build           # Compila para produção

# Produção
npm run start           # Inicia a versão compilada

# Linting
npm run lint            # Verifica lint

# Formato
npm run format          # Formata o código com Prettier
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📚 Estrutura do Projeto

```
src/
├── app/                  # Rotas e layouts
│   ├── auth/            # Páginas de autenticação
│   │   ├── login/
│   │   └── sign-up/
│   ├── admin/           # Painel administrativo
│   │   └── acessos/
│   ├── dashboard/       # Dashboard do usuário
│   └── layout.tsx
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI (shadcn)
│   ├── access-level/   # Componentes de controle de acesso
│   ├── forms/          # Componentes de formulários
│   ├── login-form.tsx
│   ├── sign-up-form.tsx
│   └── app-sidebar.tsx
├── hooks/              # Hooks customizados
│   ├── use-auth.tsx   # Hook de autenticação
│   └── use-alert.tsx  # Hook de alertas
├── services/           # Serviços de API
│   └── api.ts
├── schemas/            # Schemas de validação (Zod)
├── types/              # Definições TypeScript
└── lib/               # Utilidades
```

## 🎨 Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **HTTP Client**: Fetch API com serviço centralizado
- **State Management**: Hooks customizados
- **Validação**: Zod

## 🔑 Páginas Principais

### Autenticação
- `/auth/login` - Login de usuário
- `/auth/sign-up` - Cadastro de novo usuário

### Dashboard
- `/dashboard` - Dashboard do usuário autenticado

### Admin
- `/admin/acessos` - Gerenciamento de níveis de acesso
  - Níveis de Acesso
  - Menus do Sistema
  - Atribuição de Usuários

## 🛡️ Segurança

- Autenticação com JWT
- Refresh token automático
- Guardas de rota (verificação de autenticação)
- Proteção de informações sensíveis

## 🔄 Fluxo de Autenticação

1. Usuário faz login em `/auth/login`
2. Backend valida credenciais e retorna JWT token
3. Token é armazenado e enviado nas requisições subsequentes
4. Usuário é redirecionado para `/dashboard`
5. Rotas protegidas verificam autenticação via `use-auth` hook
6. Token expira e é automaticamente renovado com refresh token

## 📱 Responsividade

O projeto é totalmente responsivo:
- Mobile-first approach
- Tailwind CSS responsive classes
- Componentes adaptáveis

## 🎯 Hooks Customizados

### `use-auth`
```typescript
const { user, loading, login, logout, getPermissions } = useAuth()
```

### `use-alert`
```typescript
const { showAlert, showError, showSuccess } = useAlert()
```

## 🐳 Docker

```bash
# Buildar imagem
docker build -t template-web .

# Executar container
docker run -p 3000:3000 --env-file .env.local template-web

# Com docker-compose
docker-compose up
```

## 🔍 Debugging

- Use React DevTools para debug de componentes
- Use Network tab do DevTools para verificar requisições API
- Verifique Application > Local Storage para tokens JWT

## 📖 Documentação

- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Zod](https://zod.dev)

## 🤝 Contribuindo

Este é um template, sinta-se livre para adaptá-lo às suas necessidades!

---

Desenvolvido com ❤️ usando Next.js e Tailwind CSSThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
