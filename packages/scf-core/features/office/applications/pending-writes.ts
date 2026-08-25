/**
 * A short window between deciding and writing, so "Undo" has something to undo.
 *
 * ─── Why the write is delayed rather than reversed ─────────────────────────
 *
 * The prototype confirms a stage move with a toast carrying Undo. The obvious
 * implementation — move it back — is impossible here: `ALLOWED_TRANSITIONS` is
 * strictly one-way. There is no pair `(a, b)` where both `a → b` and `b → a`
 * are legal, and `hired`/`rejected`/`withdrawn` have no outgoing edges at all,
 * so `isValidStatusTransition(to, from)` is false for every move an employer
 * can make. An Undo wired to a reverse move would render, be clickable, and
 * 400 every time (#643).
 *
 * So nothing is reversed. The move is held for a few seconds and Undo cancels
 * it before it is ever sent — the same shape as Gmail's "Undo Send". The UI
 * updates immediately either way, so the delay is invisible unless you use it.
 *
 * ─── The risk this carries, and what is done about it ──────────────────────
 *
 * A held write can be lost if the app goes away mid-window. That is a real
 * cost and it is bought down, not ignored:
 *
 *   - the window is short (5s)
 *   - `flushAll` fires everything pending, and the hook calls it on unmount
 *     and on `beforeunload`
 *   - a second move on the same row flushes the first rather than discarding
 *     it, so moves can never silently overwrite one another
 *
 * What remains is a hard kill of the process inside the window. That is the
 * honest residual, and it is why the window is seconds rather than minutes.
 */

/** How long a move is held before it is written. */
export const UNDO_WINDOW_MS = 5000

type Runner = () => void | Promise<void>

interface Entry {
  timer: ReturnType<typeof setTimeout>
  run: Runner
}

export interface WriteQueue {
  /**
   * Hold `run` for the window. Scheduling over an existing key FLUSHES that
   * one first — two moves on the same row are two decisions, and dropping the
   * first would lose a write the user already made.
   */
  schedule: (key: string, run: Runner) => void
  /** Cancel before it is sent. Returns whether there was anything to cancel. */
  cancel: (key: string) => boolean
  /** Send now, skipping the rest of the window. */
  flush: (key: string) => void
  /** Send everything pending. Used on unmount and page hide. */
  flushAll: () => void
  /** Whether this key is waiting. */
  has: (key: string) => boolean
  /** How many writes are held. */
  size: () => number
}

export function createWriteQueue(delayMs: number = UNDO_WINDOW_MS): WriteQueue {
  const pending = new Map<string, Entry>()

  const flush = (key: string) => {
    const entry = pending.get(key)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.delete(key)
    void entry.run()
  }

  return {
    schedule(key, run) {
      // Flush, not cancel: see the note on `schedule` above.
      flush(key)
      const timer = setTimeout(() => {
        pending.delete(key)
        void run()
      }, delayMs)
      pending.set(key, { timer, run })
    },

    cancel(key) {
      const entry = pending.get(key)
      if (!entry) return false
      clearTimeout(entry.timer)
      pending.delete(key)
      return true
    },

    flush,

    flushAll() {
      // Snapshot the keys first — `flush` mutates the map as it goes.
      for (const key of [...pending.keys()]) flush(key)
    },

    has: (key) => pending.has(key),
    size: () => pending.size,
  }
}
