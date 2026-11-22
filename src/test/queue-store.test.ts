import { describe, it, expect } from "vitest";
import {
  buildFeedbackMessage,
  findDuplicatePhone,
  QueueClient,
} from "@/lib/queue-store";

const base: Omit<QueueClient, "id" | "status"> = {
  name: "Ana",
  phone: "(11) 98765-4321",
  partySize: 2,
  arrivalTime: 0,
  notes: "",
};

describe("buildFeedbackMessage", () => {
  it("inclui o nome, o restaurante e o link de avaliação", () => {
    const msg = buildFeedbackMessage("Ana", "Bamboo", "https://g.page/r/x");
    expect(msg).toContain("Oi, Ana!");
    expect(msg).toContain("visita ao Bamboo");
    expect(msg).toContain("https://g.page/r/x");
    expect(msg).toContain("Equipe Bamboo");
  });

  it("funciona sem link de avaliação", () => {
    const msg = buildFeedbackMessage("Ana", "Bamboo", "");
    expect(msg).not.toContain("⭐");
    expect(msg).toContain("conta pra gente como foi");
  });
});

describe("findDuplicatePhone", () => {
  it("acusa telefone repetido de quem ainda está na fila", () => {
    const queue: QueueClient[] = [{ ...base, id: "1", status: "waiting" }];
    expect(findDuplicatePhone(queue, "11987654321")?.id).toBe("1");
  });

  it("ignora quem já sentou ou desistiu", () => {
    const queue: QueueClient[] = [
      { ...base, id: "1", status: "seated" },
      { ...base, id: "2", status: "gave_up" },
    ];
    expect(findDuplicatePhone(queue, "11987654321")).toBeUndefined();
  });
});
