import { describe, expect, it } from "vitest";
import { pageWindow, paginate, parsePage } from "./pagination";

const rows = Array.from({ length: 45 }, (_, i) => i + 1);

describe("parsePage", () => {
  it("n'accepte que les entiers ≥ 1", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
    for (const bad of [undefined, "", "0", "-2", "1.5", "abc"]) expect(parsePage(bad)).toBe(1);
  });
});

describe("paginate", () => {
  it("découpe par pages de 20", () => {
    const p = paginate(rows, "2");
    expect(p.items).toEqual(rows.slice(20, 40));
    expect(p).toMatchObject({ page: 2, pageCount: 3, total: 45, from: 21, to: 40 });
  });

  it("dernière page partielle", () => {
    expect(paginate(rows, "3")).toMatchObject({ from: 41, to: 45, items: [41, 42, 43, 44, 45] });
  });

  it("une page trop grande renvoie la dernière", () => {
    expect(paginate(rows, "99").page).toBe(3);
  });

  it("liste vide : une page, aucun élément", () => {
    expect(paginate([], "1")).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      total: 0,
      from: 0,
      to: 0,
    });
  });
});

describe("pageWindow", () => {
  it("affiche tout quand il y a peu de pages", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("place des ellipses autour de la page courante", () => {
    expect(pageWindow(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, null, 12]);
    expect(pageWindow(12, 12)).toEqual([1, null, 11, 12]);
  });

  it("remplace une ellipse d'une seule page par le numéro", () => {
    expect(pageWindow(4, 12)).toEqual([1, 2, 3, 4, 5, null, 12]);
  });
});
