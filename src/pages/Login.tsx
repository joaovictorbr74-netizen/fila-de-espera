import { useState } from "react";
import { Pizza, Lock } from "lucide-react";
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Pizza className="w-7 h-7 text-primary" />
          </div>

          <h1 className="font-display text-3xl text-foreground">
            Grano <span className="text-primary">Pizza & Bar</span>
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            Acesso à fila de espera
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

          <Button type="submit" className="w-full h-12 text-base font-semibold">
            Entrar
          </Button>
        </div>
      </form>
    </div>
  );
}