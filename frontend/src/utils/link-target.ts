/* Copyright 2026 Marimo. All rights reserved. */
import { getSessionId } from "@/core/kernel/session";
import { getResolvedMarimoConfig } from "@/core/config/config";
import { getIframeCapabilities } from "./capabilities";
import { asURL } from "./url";

/**
 * Returns true if `href` resolves to the current app (same origin and under
 * the document's base URI). This is stricter than a plain same-origin check and
 * avoids treating sibling apps on the same domain as internal marimo links.
 */
export function isInternalUrl(href: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const target = asURL(href);
    const base = new URL(document.baseURI);
    return (
      target.origin === base.origin && target.pathname.startsWith(base.pathname)
    );
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
 * - Embedded + `server.iframe_embedded` enabled + internal to the app:
 *   navigate inside the iframe (`_self`).
 * - Non-embedded + `targetKey`: reuse a named tab for that key.
 * - Otherwise: open a fresh tab (`_blank`).
 */
export function getLinkProps(
  href: string,
  options?: GetLinkPropsOptions,
): LinkProps {
  const { isEmbedded } = getIframeCapabilities();
  const iframeEmbeddedEnabled =
    getResolvedMarimoConfig().server?.iframe_embedded ?? false;
  if (isEmbedded && iframeEmbeddedEnabled && isInternalUrl(href)) {
    return { target: "_self" };
  }

  if (!isEmbedded && options?.targetKey) {
    return { target: tabTarget(options.targetKey) };
  }

  return { target: "_blank", rel: "noopener noreferrer" };
}
