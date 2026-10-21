import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "./permissions";

describe("droits par rôle", () => {
  it("propriétaire et administrateur ont tous les droits", () => {
    for (const p of PERMISSIONS) {
      expect(can("owner", p)).toBe(true);
      expect(can("admin", p)).toBe(true);
    }
  });

  it("un membre prépare mais n'émet, n'encaisse ni n'administre", () => {
    expect(can("member", "quote:write")).toBe(true);
    expect(can("member", "invoice:draft")).toBe(true);
    expect(can("member", "invoice:issue")).toBe(false);
    expect(can("member", "invoice:payment")).toBe(false);
    expect(can("member", "received:process")).toBe(false);
    expect(can("member", "team:manage")).toBe(false);
    expect(can("member", "settings:manage")).toBe(false);
  });
});
