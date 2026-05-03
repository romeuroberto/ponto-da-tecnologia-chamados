import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <div className="mb-4 flex justify-center py-2">
            <BrandMark />
          </div>
          <CardTitle className="text-2xl text-white">Entrar no sistema</CardTitle>
          <CardDescription className="text-slate-400">
            Use suas credenciais para acessar a central de chamados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
