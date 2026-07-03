/* Copyright 2026 Marimo. All rights reserved. */
import { getSessionId } from "@/core/kernel/session";
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

function tabTarget(path: string): string {
  // Consistent tab target so we open in the same tab when clicking on the same
  // notebook.
  return `${getSessionId()}-${encodeURIComponent(path)}`;
}

export interface LinkProps {
  target: string;
  rel?: "noopener noreferrer";
}

export interface GetLinkPropsOptions {
  /**
   * A stable identifier for the resource. When provided and the app is not
   * embedded, links to the same key will reuse the same browser tab.
   */
  targetKey?: string;
}

/**
 * Choose a link target and rel value that respects an embedded iframe context.
 *
 * - Embedded + same-origin: navigate inside the iframe (`_self`).
 * - Non-embedded + `targetKey`: reuse a named tab for that key.
 * - Otherwise: open a fresh tab (`_blank`).
 */
export function getLinkProps(
  href: string,
  options?: GetLinkPropsOptions,
): LinkProps {
  if (getIframeCapabilities().isEmbedded) {
    return isSameOrigin(href)
      ? { target: "_self" }
      : { target: "_blank", rel: "noopener noreferrer" };
  }

  if (options?.targetKey) {
    return { target: tabTarget(options.targetKey) };
  }

  return { target: "_blank", rel: "noopener noreferrer" };
}
