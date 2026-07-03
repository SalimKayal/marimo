/* Copyright 2026 Marimo. All rights reserved. */
import { describe, expect, it, vi } from "vitest";
import type * as capabilities from "@/utils/capabilities";
import { getLinkProps, isSameOrigin } from "../link-target";

const mocks = vi.hoisted(() => {
  return {
    sessionId: "s_abcdef",
    embedded: false,
  };
});

vi.mock("@/core/kernel/session", () => ({
  getSessionId: () => mocks.sessionId,
}));

vi.mock("@/utils/capabilities", async (importOriginal) => {
  const actual = await importOriginal<typeof capabilities>();
  return {
    ...actual,
    getIframeCapabilities: vi.fn(() => ({
      isEmbedded: mocks.embedded,
      hasLocalStorage: true,
      hasSessionStorage: true,
      hasClipboard: true,
      hasDownloads: true,
      hasFullscreen: true,
      hasMediaDevices: true,
    })),
  };
});

describe("isSameOrigin", () => {
  it("returns true for a local path", () => {
    expect(isSameOrigin("/?file=notebook.py")).toBe(true);
  });

  it("returns false for an external URL", () => {
    expect(isSameOrigin("https://example.com/notebook.py")).toBe(false);
  });
});

describe("getLinkProps", () => {
  it("returns _self when embedded and same-origin", () => {
    mocks.embedded = true;
    expect(getLinkProps("/?file=notebook.py")).toEqual({ target: "_self" });
  });

  it("returns _blank with rel when embedded and cross-origin", () => {
    mocks.embedded = true;
    expect(getLinkProps("https://example.com/notebook.py")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  it("returns a named tab target when not embedded and targetKey is provided", () => {
    mocks.embedded = false;
    const key = "path/to/notebook.py";
    expect(getLinkProps("/?file=notebook.py", { targetKey: key })).toEqual({
      target: `s_abcdef-${encodeURIComponent(key)}`,
    });
  });

  it("returns the same named target for the same key", () => {
    mocks.embedded = false;
    const key = "path/to/notebook.py";
    const first = getLinkProps("/?file=notebook.py", { targetKey: key });
    const second = getLinkProps("/?file=notebook.py", { targetKey: key });
    expect(first.target).toBe(second.target);
  });

  it("returns _blank with rel when not embedded and no targetKey is provided", () => {
    mocks.embedded = false;
    expect(getLinkProps("/?file=notebook.py")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
});
