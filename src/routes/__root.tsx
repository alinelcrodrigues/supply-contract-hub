import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, FilePlus2, FileText, LogOut, Settings } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/lib/params-hooks";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import baliLogo from "@/assets/bali-logo.jpg.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BALI CONSTRUTORA" },
      { name: "description", content: "Gestão de Contratos de Suprimentos da BALI - Construtora Baeta Ligório" },
      { name: "author", content: "BALI - Construtora Baeta Ligório" },
      { property: "og:title", content: "BALI - CONSTRUTORA BAETA LIGORIO" },
      { property: "og:description", content: "Gestão de Contratos de Suprimentos da BALI - Construtora Baeta Ligório" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@BALI_Construtora" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/jpeg", href: baliLogo.url },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}

function AppHeader() {
  const router = useRouter();
  const isAuthRoute = router.state.location.pathname.startsWith("/auth");
  const { data: role } = useCurrentUserRole();

  if (isAuthRoute) return null;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white p-1">
                <img src={baliLogo.url} alt="BALI CONSTRUTORA" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="text-sm uppercase tracking-[0.15em] text-secondary font-semibold">BALI CONSTRUTORA</div>
                <div className="text-base font-semibold">Gestão de Contratos</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
              <NavLink to="/contracts" icon={<FileText className="h-4 w-4" />} label="Contratos" />
              <NavLink to="/contracts/new" icon={<FilePlus2 className="h-4 w-4" />} label="Novo contrato" />
              {role === "admin" && (
                <NavLink to="/settings" icon={<Settings className="h-4 w-4" />} label="Parametrização" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="ml-2 gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </nav>
          </div>
    </header>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
      activeProps={{ className: "bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground" }}
    >
      {icon}
      {label}
    </Link>
  );
}
