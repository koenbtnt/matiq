/**
 * Pose decoding and canonicalisation (F-12), reimplemented from the format GrappleMap documents in
 * `src/persistence.cpp` (decodePosition) and `src/players.hpp` (joint order, mirror pairs):
 * 2 players × 23 joints × (x, y, z), each coordinate two base-62 digits `d0*62 + d1`, metres = /1000,
 * x and z offset by −2; y is the vertical axis. Digits: a–z = 0–25, A–Z = 26–51, 0–9 = 52–61.
 */
export const JOINTS = [
  'LeftToe', 'RightToe', 'LeftHeel', 'RightHeel', 'LeftAnkle', 'RightAnkle', 'LeftKnee', 'RightKnee',
  'LeftHip', 'RightHip', 'LeftShoulder', 'RightShoulder', 'LeftElbow', 'RightElbow', 'LeftWrist',
  'RightWrist', 'LeftHand', 'RightHand', 'LeftFingers', 'RightFingers', 'Core', 'Neck', 'Head',
] as const;
export const JOINT_COUNT = JOINTS.length; // 23
export const POSE_DIGITS = 2 * JOINT_COUNT * 3 * 2; // 276

/** Joint index of the left/right partner (self for Core, Neck, Head). */
const MIRROR: number[] = JOINTS.map((j, i) =>
  j.startsWith('Left') ? JOINTS.indexOf(`Right${j.slice(4)}` as never) : j.startsWith('Right') ? JOINTS.indexOf(`Left${j.slice(5)}` as never) : i,
);
const LEFT_HIP = JOINTS.indexOf('LeftHip');
const RIGHT_HIP = JOINTS.indexOf('RightHip');

/** [player][joint] = [x, y, z] in metres. */
export type Pose = number[][][];

export function base62(c: string): number {
  const code = c.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 97;
  if (code >= 65 && code <= 90) return code - 65 + 26;
  if (code >= 48 && code <= 57) return code - 48 + 52;
  throw new Error(`not a base-62 digit: ${c}`);
}

export function decodePose(digits: string): Pose {
  if (digits.length !== POSE_DIGITS) throw new Error(`pose has ${digits.length} digits, expected ${POSE_DIGITS}`);
  let o = 0;
  const g = () => {
    const v = (base62(digits[o]!) * 62 + base62(digits[o + 1]!)) / 1000;
    o += 2;
    return v;
  };
  const pose: Pose = [];
  for (let p = 0; p < 2; p += 1) {
    const player: number[][] = [];
    for (let j = 0; j < JOINT_COUNT; j += 1) player.push([g() - 2, g(), g() - 2]);
    pose.push(player);
  }
  return pose;
}

const swapPlayers = (p: Pose): Pose => [p[1]!, p[0]!];
/** Mirror: x → −x with left/right joints exchanged (GrappleMap `mirror(Position)`). */
const mirror = (p: Pose): Pose => p.map((player) => MIRROR.map((src) => {
  const [x, y, z] = player[src]!;
  return [-x!, y!, z!];
}));

/** The four symmetry variants: identity, swap, mirror, swap ∘ mirror. */
export const variants = (p: Pose): Pose[] => [p, swapPlayers(p), mirror(p), swapPlayers(mirror(p))];

const hipCentre = (player: number[][]) => [
  (player[LEFT_HIP]![0]! + player[RIGHT_HIP]![0]!) / 2,
  (player[LEFT_HIP]![2]! + player[RIGHT_HIP]![2]!) / 2,
];

/**
 * Canonical orientation: the ground-plane centroid of all joints moves to the origin, then a
 * rotation about the vertical axis puts the player-0 → player-1 hip-centre vector on +x.
 * Returns a flat vector of 138 numbers.
 */
export function canonical(p: Pose): number[] {
  let cx = 0;
  let cz = 0;
  for (const player of p) for (const [x, , z] of player) {
    cx += x!;
    cz += z!;
  }
  const n = 2 * JOINT_COUNT;
  cx /= n;
  cz /= n;
  const [ax, az] = hipCentre(p[0]!);
  const [bx, bz] = hipCentre(p[1]!);
  const angle = Math.atan2(bz! - az!, bx! - ax!);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const out: number[] = [];
  for (const player of p)
    for (const [x, y, z] of player) {
      const dx = x! - cx;
      const dz = z! - cz;
      out.push(dx * cos - dz * sin, y!, dx * sin + dz * cos);
    }
  return out;
}

/** Quantised key of a canonical vector on a grid of `eps` metres. */
export const keyOf = (v: readonly number[], eps: number): string => v.map((x) => Math.round(x / eps)).join(',');

/** Root-mean-square joint distance between two canonical vectors (metres). */
export function rms(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i += 3) {
    const dx = a[i]! - b[i]!;
    const dy = a[i + 1]! - b[i + 1]!;
    const dz = a[i + 2]! - b[i + 2]!;
    s += dx * dx + dy * dy + dz * dz;
  }
  return Math.sqrt(s / (a.length / 3));
}
