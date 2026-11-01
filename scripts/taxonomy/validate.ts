import { poseCount, type GmRecord } from './parse.ts';

/** Measured property vocabulary (plan §6.1). */
export const PROPERTY_WORDS = new Set(['top', 'bottom', 'detailed', 'bidirectional', 'sweep', 'transitive']);
const POSE_LINE = /^[0-9A-Za-z]{69}$/;
const TAG = /^[a-z0-9_]+$/;

export type ValidationError = { index: number; line: number; message: string };

/**
 * GrappleMap validator (open PR 4 `validate-db.py` rules, reimplemented): non-empty name; every
 * pose line exactly 69 base-62 digits; pose lines a multiple of four and at least one pose;
 * tags `[a-z0-9_]+`; property words from the measured set.
 */
export function validateRecords(records: readonly GmRecord[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const r of records) {
    const err = (message: string, line = r.startLine) => errors.push({ index: r.index, line, message });
    if (r.name.trim() === '') err('empty name');
    r.poseLines.forEach((l, i) => {
      if (!POSE_LINE.test(l)) err('pose line is not 69 base-62 digits', r.poseLineNos[i]);
    });
    if (r.poseLines.length % 4 !== 0) err(`pose line count ${r.poseLines.length} is not a multiple of 4`);
    if (poseCount(r) < 1) err('record has no pose');
    for (const t of r.tags) if (!TAG.test(t)) err(`bad tag "${t}"`);
    for (const p of r.properties) if (!PROPERTY_WORDS.has(p)) err(`unknown property "${p}"`);
  }
  return errors;
}
