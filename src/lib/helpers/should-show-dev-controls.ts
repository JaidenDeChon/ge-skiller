/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns true only when environment = "development"
 * Works safely in Node, Bun, Deno, and the browser without runtime errors.
 */
export function shouldShowDevControls(): boolean {
  const g = globalThis as any;

  /* ------------------ DENO CHECK ------------------ */
  try {
    const d = g.Deno;
    const denoEnvGetter = d?.env?.get?.bind(d.env) as
      | ((key: string) => string | undefined)
      | undefined;

    if (denoEnvGetter) {
      const env = denoEnvGetter("ENV") ?? denoEnvGetter("NODE_ENV");
      if (env === "development") return true;
    }
  } catch {
    // ignore lack of --allow-env / weird host issues
  }

  /* ---------------- NODE + BUN CHECK ---------------- */
  try {
    const proc = g.process; // safe: comes from globalThis
    const nodeEnv =
      proc?.env?.ENV ??
      proc?.env?.NODE_ENV;

    if (nodeEnv === "development") return true;
  } catch {
    // ignore; likely not in Node/Bun
  }

  // In the browser or unknown env: default to hiding dev controls
  return false;
}