/* Copyright 2026 Marimo. All rights reserved. */
import { getIframeCapabilities } from "./capabilities";
import { asURL } from "./url";

/**
 * Returns true if `href` resolves to the current origin.
 */
export function isSameOrigin(href: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    return asURL(href).origin === window.location.origin;
  } catch {
    return false;
  }
}

export interface LinkProps {
  target: "_self" | "_blank";
  rel?: "noopener noreferrer";
}

/**
 * Choose a link target and rel value that respects an embedded iframe context.
 * Same-origin links stay inside the iframe when embedded; everything else
 * still opens in a new tab.
 */
export function getLinkProps(href: string): LinkProps {
  if (!getIframeCapabilities().isEmbedded) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return isSameOrigin(href)
    ? { target: "_self" }
    : { target: "_blank", rel: "noopener noreferrer" };
}
