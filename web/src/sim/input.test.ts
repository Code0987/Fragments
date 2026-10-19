import { describe, expect, it } from "vitest";
import { combineInput, mapKeys, mapPointers } from "./input";

describe("mapPointers", () => {
  const width = 200;

  it("reads an empty screen as none", () => {
    expect(mapPointers([], width)).toBe("none");
  });

  it("maps each half, and one contact on each half as both", () => {
    expect(mapPointers([20], width)).toBe("left");
    expect(mapPointers([180], width)).toBe("right");
    expect(mapPointers([20, 180], width)).toBe("both");
    expect(mapPointers([180, 20], width)).toBe("both");
  });

  it("keeps two contacts on the same half on that side", () => {
    expect(mapPointers([10, 40], width)).toBe("left");
    expect(mapPointers([120, 190], width)).toBe("right");
  });

  it("ignores a third contact", () => {
    expect(mapPointers([10, 40, 180], width)).toBe("left");
  });
});

describe("mapKeys", () => {
  it("maps sides, space, and both directions", () => {
    expect(mapKeys({ left: false, right: false, both: false })).toBe("none");
    expect(mapKeys({ left: true, right: false, both: false })).toBe("left");
    expect(mapKeys({ left: false, right: true, both: false })).toBe("right");
    expect(mapKeys({ left: false, right: false, both: true })).toBe("both");
    expect(mapKeys({ left: true, right: true, both: false })).toBe("both");
    expect(mapKeys({ left: true, right: false, both: true })).toBe("both");
  });
});

describe("combineInput", () => {
  it("lets either device drive, and opposite sides split", () => {
    expect(combineInput("none", "left")).toBe("left");
    expect(combineInput("right", "none")).toBe("right");
    expect(combineInput("left", "left")).toBe("left");
    expect(combineInput("left", "right")).toBe("both");
    expect(combineInput("both", "left")).toBe("both");
  });
});
