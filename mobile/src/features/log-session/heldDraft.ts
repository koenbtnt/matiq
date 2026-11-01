import type { LogDraft } from './state';

/** D-A9: the discarded draft lives in memory exactly as long as its Undo toast (R1-17). */
let held: LogDraft | undefined;

export const heldDraft = {
  hold(d: LogDraft) { held = d; },
  take(): LogDraft | undefined { const d = held; held = undefined; return d; },
  clear() { held = undefined; },
  peek: () => held,
};
