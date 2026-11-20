import { useState } from "react";
import { Lock, Mail, Loader2 } from "lucide-react";
import BambooLogo from "@/components/BambooLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Login da recepção com Supabase Auth (e-mail e senha).
 * Os usuários são criados no painel do Supabase: Authentication > Users.
 * Depois de entrar, a tela da fila aparece sozinha (Index escuta a sessão).
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : `Não foi possível entrar: ${error.message}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-bamboo text-foreground flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <h1>
            <BambooLogo subtitle="Fila de espera" size="lg" />
          </h1>

          <p className="text-sm text-muted-foreground mt-4">
            Acesso da recepção
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail"
              aria-label="E-mail"
              autoComplete="username"
              className="h-12 pl-10 text-base"
              required
              autoFocus
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              aria-label="Senha"
              autoComplete="current-password"
              className="h-12 pl-10 text-base"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 text-sm font-extrabold tracking-[0.2em]"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR"}
          </Button>
        </div>
      </form>
    </div>
  );
}
