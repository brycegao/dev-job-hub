import { describe, it, expect } from "vitest";
import { createId, unique } from "./common";

describe("createId", () => {
  it("returns a string", () => {
    const id = createId();
    expect(typeof id).toBe("string");
  });

  it("returns values with non-zero length", () => {
    const id = createId();
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns different values on multiple calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createId()));
    expect(ids.size).toBe(20);
  });
});

describe("unique", () => {
  it("removes duplicates while preserving order", () => {
    const result = unique(["a", "b", "a", "c", "b"]);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty input", () => {
    expect(unique([])).toEqual([]);
  });

  it("returns same array when there are no duplicates", () => {
    const input = ["a", "b", "c", "d"];
    const result = unique(input);
    expect(result).toEqual(["a", "b", "c", "d"]);
  });
});
