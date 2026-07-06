/* Copyright 2026 Marimo. All rights reserved. */
import { asURL } from "./url";
import { getLinkProps } from "./link-target";

/**
 * Open a URL, staying inside the current iframe when embedded and the URL is
 * internal to the app; otherwise open it in a new tab.
 */
export function openUrl(url: string): void {
  const { target } = getLinkProps(url);
  if (target === "_self") {
    window.location.href = url;
  } else {
    window.open(url, target, "noopener");
  }
}

/**
 * Open a notebook, by file path, in a new tab when running standalone or in
 * the current iframe when embedded.
 * @param path - The path to the notebook.
 */
export function openNotebook(path: string) {
  // There is no leading `/` in the path in order to work when marimo is at a subpath.
  const url = asURL(`?file=${encodeURIComponent(path)}`).toString();
  openUrl(url);
}
