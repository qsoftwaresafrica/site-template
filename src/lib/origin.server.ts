import { getRequest, getRequestHeader } from "@tanstack/react-start/server";

/** Absolute origin of the current request, proxy-aware inside the sandbox. */
export function requestOrigin(): string {
  const req = getRequest();
  const url = new URL(req.url);
  const forwarded = url.hostname === "localhost" ? getRequestHeader("x-forwarded-host") : null;
  return forwarded ? `https://${forwarded}` : url.origin;
}
