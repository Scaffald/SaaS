/**
 * Telling "the app is wrong" apart from "the harness lost its dev server".
 *
 * The Expo dev server OOMs partway through a back-to-back smoke run (#680).
 * Everything after that point fails with net::ERR_CONNECTION_REFUSED and, until
 * this module existed, exited 1 — indistinguishable from a real assertion
 * failure. One observed run reported three failures that were all the dead
 * server; all three passed individually against a fresh one.
 *
 * That is worse than having no gate. The failures cannot be told apart without
 * hand-checking each, and the natural response — re-run and see — is exactly
 * how a real failure gets waved through.
 *
 * So: a smoke that cannot reach the server exits INFRA (97), never 1, and says
 * so in a line that does not look like an assertion.
 */

/** The dev server was unreachable. Not an app failure. */
export const EXIT_INFRA = 97

const UNREACHABLE = [
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET',
  'ERR_EMPTY_RESPONSE',
  'ECONNREFUSED',
  'ECONNRESET',
  'fetch failed',
  'socket hang up',
]

/** Does this error mean the server is gone, rather than the page being wrong? */
export function isServerGone(err) {
  const text = String(err?.message ?? err ?? '')
  return UNREACHABLE.some((needle) => text.includes(needle))
}

/**
 * Preflight. Call before launching a browser: if the server is not answering,
 * there is no point starting, and starting is what produces the misleading
 * failure.
 */
export async function requireServer(base, { timeoutMs = 10_000 } = {}) {
  try {
    const res = await fetch(base, { signal: AbortSignal.timeout(timeoutMs) })
    // Any HTTP answer means something is listening and routing. A 404 on the
    // base path is fine; the individual smoke asserts on its own routes.
    if (res.status >= 500) {
      bail(base, `answered ${res.status}`)
    }
  } catch (err) {
    bail(base, err?.message ?? String(err))
  }
}

/**
 * Exit the way a smoke should.
 *
 * A preflight alone is not enough: the server dies *during* the run, and the
 * scripts catch page errors internally and tally them, so a dead server shows
 * up as a pile of ordinary-looking failures. This is the one place every smoke
 * already funnels through — each ends in `process.exit(failures ? 1 : 0)` — so
 * asking "is the server still there?" at the moment we are about to report
 * failure catches the mid-run death without restructuring seven scripts.
 *
 * A clean pass needs no check: if assertions passed, the server was answering.
 */
export async function finish(base, failed) {
  if (!failed) process.exit(0)

  if (!(await serverAlive(base))) {
    bail(base, 'stopped answering partway through the run')
  }
  process.exit(1)
}

async function serverAlive(base, { timeoutMs = 10_000 } = {}) {
  try {
    const res = await fetch(base, { signal: AbortSignal.timeout(timeoutMs) })
    return res.status < 500
  } catch {
    return false
  }
}

function bail(base, detail) {
  console.error('')
  console.error(`⚠ DEV SERVER UNREACHABLE at ${base}`)
  console.error(`  ${detail}`)
  console.error('')
  console.error('  This is NOT a smoke failure — nothing was asserted. The Expo')
  console.error('  dev server is not answering, most likely having run out of')
  console.error(`  heap partway through the run (#680). Exiting ${EXIT_INFRA}.`)
  console.error('')
  console.error('  Restart it with `pnpm web` and re-run this smoke alone.')
  process.exit(EXIT_INFRA)
}
