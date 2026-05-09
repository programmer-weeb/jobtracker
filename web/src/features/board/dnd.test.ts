import { describe, expect, it } from "vitest";
import { resolveDragMove, applyBoardMove, parseCardId, cardId, columnId } from "./dnd";
import type { BoardColumns } from "./model";

const baseColumns: BoardColumns = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wishlist: [{ id: 1, status: "wishlist" } as any],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applied: [{ id: 2, status: "applied" } as any, { id: 3, status: "applied" } as any],
  interview: [],
  offer: [],
  rejected: [],
  archived: []
};

describe("dnd utility", () => {
  it("cardId generates correct id", () => {
    expect(cardId(42)).toBe("card:42");
  });

  it("columnId generates correct id", () => {
    expect(columnId("applied")).toBe("column:applied");
  });

  it("parseCardId parses valid id", () => {
    expect(parseCardId("card:42")).toBe(42);
  });

  it("parseCardId returns null for invalid prefix", () => {
    expect(parseCardId("column:applied")).toBeNull();
    expect(parseCardId(null)).toBeNull();
  });

  it("resolveDragMove returns null if source index not found", () => {
    expect(resolveDragMove({
      activeCardId: 99,
      activeStatus: "applied",
      overType: "column",
      overStatus: "wishlist",
      columns: baseColumns
    })).toBeNull();
  });

  it("resolveDragMove handles move to column", () => {
    const move = resolveDragMove({
      activeCardId: 2,
      activeStatus: "applied",
      overType: "column",
      overStatus: "wishlist",
      columns: baseColumns
    });
    expect(move).toEqual({
      applicationId: 2,
      fromStatus: "applied",
      toStatus: "wishlist",
      toIndex: 1
    });
  });

  it("resolveDragMove handles move over card", () => {
    const move = resolveDragMove({
      activeCardId: 2,
      activeStatus: "applied",
      overType: "card",
      overStatus: "applied",
      overCardId: 3,
      columns: baseColumns
    });
    expect(move).toEqual({
      applicationId: 2,
      fromStatus: "applied",
      toStatus: "applied",
      toIndex: 1
    });
  });

  it("resolveDragMove returns null if over card not found", () => {
    expect(resolveDragMove({
      activeCardId: 2,
      activeStatus: "applied",
      overType: "card",
      overStatus: "applied",
      overCardId: 99,
      columns: baseColumns
    })).toBeNull();
  });

  it("applyBoardMove moves within same column", () => {
    const move = { applicationId: 2, fromStatus: "applied" as const, toStatus: "applied" as const, toIndex: 1 };
    const { columns, position } = applyBoardMove(baseColumns, move);
    expect(position).toBe(1);
    expect(columns.applied[0].id).toBe(3);
    expect(columns.applied[1].id).toBe(2);
  });

  it("applyBoardMove moves across columns", () => {
    const move = { applicationId: 2, fromStatus: "applied" as const, toStatus: "wishlist" as const, toIndex: 0 };
    const { columns, position } = applyBoardMove(baseColumns, move);
    expect(position).toBe(0);
    expect(columns.wishlist[0].id).toBe(2);
    expect(columns.wishlist[1].id).toBe(1);
    expect(columns.applied.length).toBe(1);
  });

  it("applyBoardMove returns original columns if source not found", () => {
    const move = { applicationId: 99, fromStatus: "applied" as const, toStatus: "wishlist" as const, toIndex: 0 };
    const { columns, position } = applyBoardMove(baseColumns, move);
    expect(position).toBe(0);
    expect(columns).toEqual(baseColumns);
  });
});
