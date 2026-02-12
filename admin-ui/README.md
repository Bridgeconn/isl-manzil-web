# Complete Setup Guide: React + Vite + TypeScript Stack

This document provides a detailed, step-by-step guide to set up a modern React application with Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, and TanStack Table from scratch.

## Resources used

A modern React application with:

- **Vite** for fast development and building
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful UI components
- **TanStack Query** for server state management
- **TanStack Table** for table management utilities
- **Supertoken** for authentication and session management

---

## 📋 Prerequisites

Ensure you have these installed:

- **Node.js** (v18 or higher)
- **PNPM** (recommended package manager)

Install PNPM if you haven't:

```bash
npm install -g pnpm
```

---

## 🚀 Step-by-Step Setup

### Step 1: Create Vite React TypeScript Project

```bash
# Create a new Vite project with React TypeScript template
pnpm create vite@latest .

# Navigate to project directory
cd ui

# Install base dependencies
pnpm install
```

**What this creates:**

- Basic React + TypeScript setup
- Vite configuration
- ESLint configuration
- Basic folder structure

**Files created:**

- `package.json`
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `src/App.tsx`, `src/main.tsx`
- `index.html`

---

### Step 2: Install and Configure Tailwind CSS

```bash
# Install Tailwind CSS and its dependencies
pnpm add tailwindcss @tailwindcss/vite
```

Replace everything in src/index.css with the following:
`src/index.css `

```bash
@import "tailwindcss";
```

**Configure Tailwind CSS:**

Edit `tsconfig.json` file

```javascript
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Edit `tsconfig.app.json` file

```Javascript
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
    // ...
  }
}
```

**Update vite.config.ts**

Install this

```bash
pnpm add -D @types/node
```

Add this to `vite.config.ts`

```Javascript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Step3 : Set Up shadcn/ui

**Run the CLI**

---

```bash
# Initialize shadcn/ui
pnpm dlx shadcn@latest init
```

**Configuration prompts:**

- ✅ TypeScript: Yes
- ✅ Style: Default
- ✅ Base color: Slate (or your preference)
- ✅ CSS variables: Yes

**What this does:**

- Creates `components.json` configuration file
- Updates `tailwind.config.js` with shadcn theme
- Creates `src/lib/utils.ts` utility file
- Sets up the `src/components/ui/` directory structure

**Add some basic components:**

```bash
# Install commonly used components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
```

---

### Step 4: Install TanStack Query

```bash
# Install TanStack Query
pnpm install @tanstack/react-query

```

Wrapping the App in Tanstack query client

```Javascript
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Optional: Add React Query DevTools**

```bash
pnpm install @tanstack/react-query-devtools
```

---

### Step 5: Install TanStack Table

```bash
# Install TanStack Table
pnpm install @tanstack/react-table

```
```bash
# Install axios
pnpm add axios
```

### Step 6: Install SuperTokens

```bash
pnpm add supertokens-auth-react supertokens-web-js
```

For detailed instructions & code setup, visit the official setup guide:

👉 [SuperTokens Frontend Setup Guide](https://supertokens.com/docs/quickstart/frontend-setup)

---

### Step 6: Create Project Structure

```bash
# Create necessary directories
mkdir -p src/components/ui
mkdir -p src/pages
mkdir -p src/store
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
```

**Final project structure:**

```
src/
├── components/
│   └── ui/              # shadcn/ui components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # API services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── lib/                 # shadcn/ui utilities
├── App.tsx              # Main App component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

---

### Step 7: Test Everything

```bash
# Start development server
pnpm run dev
```

### Visit `http://localhost:5173`

---

## 🚀 Next Steps

Your stack is now ready! You can:

1. **Add routing** with React Router
2. **Set up API services** for real data fetching
3. **Install more shadcn/ui components** as needed
4. **Configure ESLint and Prettier** for code quality
5. **Set up testing** with Vitest and Testing Library

---

This completes your modern React development stack setup! 🎉
