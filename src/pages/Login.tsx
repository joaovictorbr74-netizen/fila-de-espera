import { useState } from "react";
import { Lock } from "lucide-react";
import BambooLogo from "@/components/BambooLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState("");

  const appPassword = import.meta.env.VITE_APP_PASSWORD;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!appPassword) {
      toast.error("Senha do sistema não configurada.");
      return;
    }

    if (password !== appPassword) {
      toast.error("Senha incorreta.");
      return;
    }

    localStorage.setItem("queue-authenticated", "true");
    onLogin();
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
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />

            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              className="h-12 pl-10 text-base"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full h-12 text-sm font-extrabold tracking-[0.2em]">
            ENTRAR
          </Button>
        </div>
      </form>
    </div>
  );
}