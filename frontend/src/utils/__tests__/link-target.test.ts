/* Copyright 2026 Marimo. All rights reserved. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as capabilities from "@/utils/capabilities";
import type * as config from "@/core/config/config";
import { getLinkProps, isInternalUrl } from "../link-target";

const mocks = vi.hoisted(() => {
  return {
    sessionId: "s_abcdef",
    embedded: false,
    iframeEmbedded: false,
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

vi.mock("@/core/config/config", async (importOriginal) => {
  const actual = await importOriginal<typeof config>();
  return {
    ...actual,
    getResolvedMarimoConfig: vi.fn(() => ({
      server: {
        iframe_embedded: mocks.iframeEmbedded,
      },
    })),
  };
});

describe("isInternalUrl", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true for a local path under the base URI", () => {
    expect(isInternalUrl("/?file=notebook.py")).toBe(true);
  });

  it("returns false for an external URL", () => {
    expect(isInternalUrl("https://example.com/notebook.py")).toBe(false);
  });

  it("returns false for a same-origin URL outside the base URI path", () => {
    vi.stubGlobal("document", {
      ...document,
      baseURI: "http://localhost:3000/marimo/",
    });
    expect(isInternalUrl("http://localhost:3000/other-app/notebook.py")).toBe(
      false,
    );
  });

  it("returns true for a URL under the base URI path", () => {
    vi.stubGlobal("document", {
      ...document,
      baseURI: "http://localhost:3000/marimo/",
    });
    expect(
      isInternalUrl("http://localhost:3000/marimo/?file=notebook.py"),
    ).toBe(true);
  });
});

describe("getLinkProps", () => {
  beforeEach(() => {
    mocks.embedded = false;
    mocks.iframeEmbedded = false;
    vi.unstubAllGlobals();
  });

  it("returns _blank with rel when embedded but iframe_embedded is disabled", () => {
    mocks.embedded = true;
    mocks.iframeEmbedded = false;
    expect(getLinkProps("/?file=notebook.py")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  it("returns _self when embedded, iframe_embedded is enabled, and the URL is internal", () => {
    mocks.embedded = true;
    mocks.iframeEmbedded = true;
    expect(getLinkProps("/?file=notebook.py")).toEqual({ target: "_self" });
  });

  it("returns _blank with rel when embedded, iframe_embedded is enabled, and the URL is external", () => {
    mocks.embedded = true;
    mocks.iframeEmbedded = true;
    expect(getLinkProps("https://example.com/notebook.py")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });

  it("returns _blank with rel when embedded, iframe_embedded is enabled, and the URL is outside the base URI", () => {
    mocks.embedded = true;
    mocks.iframeEmbedded = true;
    vi.stubGlobal("document", {
      ...document,
      baseURI: "http://localhost:3000/marimo/",
    });
    expect(getLinkProps("http://localhost:3000/other-app/notebook.py")).toEqual(
      {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    );
  });

  it("returns a named tab target when not embedded and targetKey is provided", () => {
    const key = "path/to/notebook.py";
    expect(getLinkProps("/?file=notebook.py", { targetKey: key })).toEqual({
      target: `s_abcdef-${encodeURIComponent(key)}`,
    });
  });

  it("returns the same named target for the same key", () => {
    const key = "path/to/notebook.py";
    const first = getLinkProps("/?file=notebook.py", { targetKey: key });
    const second = getLinkProps("/?file=notebook.py", { targetKey: key });
    expect(first.target).toBe(second.target);
  });

  it("returns _blank with rel when not embedded and no targetKey is provided", () => {
    expect(getLinkProps("/?file=notebook.py")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
});
