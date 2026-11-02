import { screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { techniques } from '../src/__mocks__/fixtures';
import { renderScreen } from '../src/__mocks__/renderScreen';
import { LibraryEditSheet } from '../src/features/library/LibraryEditSheet';
import { ResourceEditSheet } from '../src/features/library/ResourceEditSheet';
import { LogSessionScreen } from '../src/features/log-session/LogSessionScreen';
import { WhySheet } from '../src/features/progress/WhySheet';
import { SetRankSheet } from '../src/features/rank/SetRankSheet';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { useLocalSearchParams } = require('../src/__mocks__/routerMock');

/**
 * Layout contract of every sheet under `SheetChrome` (CO-47). Jest has no native layout, so the contract is
 * structural, read off the rendered host tree: (1) no scroll view sets `automaticallyAdjustKeyboardInsets` (it
 * rendered the body blank when the keyboard opened during the formSheet presentation; one keyboard mechanism per
 * sheet), (2) every body scroll view sits inside a `SheetBody` that clips to the area below the header,
 * (3) sheets with inputs are rooted in a keyboard-avoiding view (the only thing that lifts the pinned bar).
 */
type Json = { type: string; props: Record<string, unknown>; children: (Json | string)[] | null };
const kids = (n: Json) => (n.children ?? []).filter((c): c is Json => typeof c !== 'string');

function scrollViews(node: Json, ancestors: Json[] = [], out: { node: Json; ancestors: Json[] }[] = []) {
  if (node.type === 'RCTScrollView') out.push({ node, ancestors });
  for (const c of kids(node)) scrollViews(c, [...ancestors, node], out);
  return out;
}
const tree = () => screen.toJSON() as unknown as Json;
const clipped = (ancestors: Json[]) => ancestors.some((a) => StyleSheet.flatten(a.props.style as never)?.overflow === 'hidden');
const find = (node: Json, testID: string): Json | undefined =>
  node.props.testID === testID ? node : kids(node).map((c) => find(c, testID)).find(Boolean);

const sheets = [
  { name: 'resource-edit', rootID: 'resourceEdit.sheet', inputs: true, open: () => { useLocalSearchParams.mockReturnValue({ techniqueId: techniques[0]!.id }); return renderScreen(<ResourceEditSheet />); } },
  { name: 'library-edit', rootID: 'libraryEdit.sheet', inputs: true, open: () => { useLocalSearchParams.mockReturnValue({}); return renderScreen(<LibraryEditSheet />); } },
  { name: 'log / plan', rootID: 'log.sheet', inputs: true, open: () => renderScreen(<LogSessionScreen params={{ mode: 'log' }} />) },
  { name: 'why', rootID: 'why.sheet', inputs: false, open: () => { useLocalSearchParams.mockReturnValue({ kind: 'POSITION', refId: 'pos-half' }); return renderScreen(<WhySheet />); } },
  { name: 'set-rank', rootID: undefined, inputs: false, open: () => { useLocalSearchParams.mockReturnValue({}); return renderScreen(<SetRankSheet />); } },
];

describe.each(sheets)('sheet layout contract: $name', ({ open, inputs, rootID }) => {
  beforeEach(() => jest.clearAllMocks());

  it('has a body scroll view clipped below the header (SheetBody)', async () => {
    await open();
    const bodies = scrollViews(tree()).filter((s) => !s.node.props.horizontal);
    expect(bodies.length).toBeGreaterThan(0);
    for (const b of bodies) expect(clipped(b.ancestors)).toBe(true);
  });

  it('never lets a native scroll view adjust keyboard insets itself', async () => {
    await open();
    for (const s of scrollViews(tree())) expect(s.node.props.automaticallyAdjustKeyboardInsets).toBeFalsy();
  });

  if (inputs && rootID) {
    it('is rooted in a keyboard-avoiding view', async () => {
      await open();
      // KeyboardAvoidingView renders a View carrying onLayout/onStartShouldSetResponder bookkeeping; a plain View does not.
      expect(typeof find(tree(), rootID)?.props.onLayout).toBe('function');
    });
  }
});
