/**
 * GrappleMap.txt record grammar (stack-notes; GrappleMap `src/persistence.cpp` readSeqs): a record is
 * one unindented name line, zero or more unindented description/meta lines, then its pose lines
 * (four spaces + 69 base-62 digits, four lines per pose). A new record starts at the first
 * unindented line after a pose line.
 */
export type RawRecord = {
  /** 0-based record index in file order — the stable `gm:<index>` source id. */
  index: number;
  /** 1-based line number of the name line in GrappleMap.txt. */
  startLine: number;
  /** Exact bytes of the record in the source file (lines with their newlines). */
  text: string;
};

export type GmRecord = {
  index: number;
  startLine: number;
  /** Raw name line (literal `\n` sequences kept). */
  name: string;
  description: string[];
  tags: string[];
  refs: string[];
  properties: string[];
  /** Pose lines without their indent, in order (4 per pose). */
  poseLines: string[];
  /** 1-based file line number of each pose line. */
  poseLineNos: number[];
};

const POSE_INDENT = '    ';

/** Splits the file into records, each the exact substring it occupies (so join is byte-identical). */
export function splitRecords(text: string): RawRecord[] {
  const records: RawRecord[] = [];
  let start = 0;
  let startLine = 1;
  let lastWasPose = false;
  let offset = 0;
  let line = 1;
  while (offset < text.length) {
    const nl = text.indexOf('\n', offset);
    const end = nl === -1 ? text.length : nl + 1;
    const isPose = text.startsWith(POSE_INDENT, offset);
    if (!isPose && lastWasPose) {
      records.push({ index: records.length, startLine, text: text.slice(start, offset) });
      start = offset;
      startLine = line;
    }
    lastWasPose = isPose;
    offset = end;
    line += 1;
  }
  if (start < text.length) records.push({ index: records.length, startLine, text: text.slice(start) });
  return records;
}

export const joinRecords = (records: readonly { text: string }[]): string => records.map((r) => r.text).join('');

/** Structures one raw record; never throws (validation reports problems). */
export function parseRecord(raw: RawRecord): GmRecord {
  const lines = raw.text.endsWith('\n') ? raw.text.slice(0, -1).split('\n') : raw.text.split('\n');
  const rec: GmRecord = {
    index: raw.index,
    startLine: raw.startLine,
    name: lines[0] ?? '',
    description: [],
    tags: [],
    refs: [],
    properties: [],
    poseLines: [],
    poseLineNos: [],
  };
  lines.slice(1).forEach((l, i) => {
    if (l.startsWith(POSE_INDENT)) {
      rec.poseLines.push(l.slice(POSE_INDENT.length));
      rec.poseLineNos.push(raw.startLine + 1 + i);
    } else if (l.startsWith('tags:')) rec.tags.push(...l.slice(5).trim().split(/\s+/).filter(Boolean));
    else if (l.startsWith('ref:')) rec.refs.push(l.slice(4).trim());
    else if (l.startsWith('properties:')) rec.properties.push(...l.slice(11).trim().split(/\s+/).filter(Boolean));
    else rec.description.push(l);
  });
  return rec;
}

export const poseCount = (r: GmRecord): number => Math.floor(r.poseLines.length / 4);

/** The 276 digits of pose `i` (four lines concatenated). */
export const poseDigits = (r: GmRecord, i: number): string => r.poseLines.slice(i * 4, i * 4 + 4).join('');

export const isPosition = (r: GmRecord): boolean => poseCount(r) === 1;
