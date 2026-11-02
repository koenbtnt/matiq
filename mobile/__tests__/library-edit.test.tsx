import { act, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { positions, subjects, techniques } from '../src/__mocks__/fixtures';
import { mockStore } from '../src/__mocks__/mockStore';
import { progressStore } from '../src/__mocks__/progressStore';
import { renderScreen } from '../src/__mocks__/renderScreen';
import { LibraryEditSheet } from '../src/features/library/LibraryEditSheet';
import { LibraryScreen } from '../src/features/library/LibraryScreen';
import { PositionDetailScreen } from '../src/features/library/PositionDetailScreen';
import { ResourceEditSheet } from '../src/features/library/ResourceEditSheet';
import { TechniqueDetailScreen } from '../src/features/library/TechniqueDetailScreen';

jest.mock('expo-router', () => require('../src/__mocks__/routerMock'));
jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
const { router, useLocalSearchParams } = require('../src/__mocks__/routerMock');

const has = (s: string) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const tax = () => mockStore.taxonomy;
const open = (params: Record<string, string>) => useLocalSearchParams.mockReturnValue(params);
const type = async (id: string, text: string) => fireEvent.changeText(screen.getByTestId(id), text);

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({});
});

describe('Library entry points (P-16)', () => {
  it('the plus button adds to the active segment', async () => {
    await renderScreen(<LibraryScreen />);
    expect(screen.getByTestId('library.add')).toHaveProp('accessibilityLabel', 'Add position');
    await fireEvent.press(screen.getByTestId('library.add'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library-edit', params: { kind: 'POSITION' } });
    await fireEvent.press(screen.getByTestId('library.segment.techniques'));
    expect(screen.getByTestId('library.add')).toHaveProp('accessibilityLabel', 'Add technique');
    await fireEvent.press(screen.getByTestId('library.add'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library-edit', params: { kind: 'TECHNIQUE' } });
  });

  it('technique rows open the detail and subject rows open the edit sheet', async () => {
    await renderScreen(<LibraryScreen />);
    await fireEvent.press(screen.getByTestId('library.segment.techniques'));
    await fireEvent.press(screen.getByTestId('library.technique.tec-scissor'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library/technique/[id]', params: { id: 'tec-scissor' } });
    await fireEvent.press(screen.getByTestId('library.segment.subjects'));
    await fireEvent.press(screen.getByTestId('library.subject.sub-grips'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library-edit', params: { kind: 'SUBJECT', id: 'sub-grips' } });
  });

  it('position detail has a header Edit and shows the user notes', async () => {
    await renderScreen(<PositionDetailScreen id="pos-half" />, () => { tax().notes.set('pos-half', 'Keep the knee shield up.'); });
    expect(screen.getByText('Keep the knee shield up.')).toBeTruthy();
    expect(screen.getByTestId('position.edit')).toHaveProp('accessibilityLabel', 'Edit Half guard');
    await fireEvent.press(screen.getByTestId('position.edit'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/library-edit', params: { kind: 'POSITION', id: 'pos-half' } });
    await fireEvent.press(screen.getByTestId('position.technique.tec-knee-cut'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library/technique/[id]', params: { id: 'tec-knee-cut' } });
  });
});

describe('library-edit: create', () => {
  it('disables Save with the reason until the name is filled, then adds the position with an Undo toast', async () => {
    open({ kind: 'POSITION' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.getByTestId('libraryEdit.title')).toHaveTextContent('Add position');
    expect(screen.getByTestId('libraryEdit.save.reason')).toHaveTextContent('Enter a name to save.');
    expect(screen.getByTestId('libraryEdit.save')).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
    expect(screen.getByText(has('You can add aliases after saving'))).toBeTruthy();
    await type('libraryEdit.field.name', '  Zeta guard ');
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(router.back).toHaveBeenCalled();
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Position added');
    expect(positions.some((p) => p.canonicalName === 'Zeta guard' && p.tier === 'CORE')).toBe(true);
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(positions.some((p) => p.canonicalName === 'Zeta guard')).toBe(false);
  });

  it('shows the duplicate-name error in the banner and stays open', async () => {
    open({ kind: 'POSITION' });
    await renderScreen(<LibraryEditSheet />);
    await type('libraryEdit.field.name', 'mount');
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(await screen.findByTestId('libraryEdit.error')).toHaveTextContent(has('Another entry or alias already has that name'));
    expect(router.back).not.toHaveBeenCalled();
  });

  it('a technique needs a type, a from position and (unless a submission) a target', async () => {
    open({ kind: 'TECHNIQUE' });
    await renderScreen(<LibraryEditSheet />);
    await type('libraryEdit.field.name', 'Hip bump sweep');
    expect(screen.getByTestId('libraryEdit.save.reason')).toHaveTextContent('Pick the starting position to save.');
    await fireEvent.press(screen.getByTestId('libraryEdit.type.SWEEP'));
    expect(screen.getByTestId('libraryEdit.type.SWEEP')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    await fireEvent.press(await screen.findByTestId('libraryEdit.from.result.pos-closed'));
    expect(screen.getByTestId('libraryEdit.from.selected')).toHaveTextContent('Closed guard');
    expect(screen.getByTestId('libraryEdit.save.reason')).toHaveTextContent('Pick the target position to save.');
    await fireEvent.press(await screen.findByTestId('libraryEdit.to.result.pos-mount'));
    expect(screen.queryByTestId('libraryEdit.save.reason')).toBeNull();
    await fireEvent.press(screen.getByTestId('libraryEdit.perspective.BOTTOM'));
    await fireEvent.press(screen.getByTestId('libraryEdit.appliesTo.GI'));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Technique added');
    const created = techniques.find((x) => x.name === 'Hip bump sweep')!;
    expect(created).toMatchObject({ type: 'SWEEP', fromPositionId: 'pos-closed', toPositionId: 'pos-mount', appliesTo: 'GI', perspective: 'BOTTOM' });
  });

  it('a submission has no target position', async () => {
    open({ kind: 'TECHNIQUE' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.queryByTestId('libraryEdit.to.input')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('libraryEdit.type.SUBMISSION'));
    expect(screen.queryByTestId('libraryEdit.to.input')).toBeNull();
    await type('libraryEdit.field.name', 'Triangle');
    await fireEvent.press(await screen.findByTestId('libraryEdit.from.result.pos-closed'));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    await screen.findByTestId('toast.message');
    expect(techniques.find((x) => x.name === 'Triangle')).toMatchObject({ type: 'SUBMISSION', toPositionId: undefined });
  });

  it('adds a subject', async () => {
    open({ kind: 'SUBJECT' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.queryByTestId('libraryEdit.field.notes')).toBeNull();
    await type('libraryEdit.field.name', 'Wrestling up');
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Subject added');
    expect(subjects.some((s) => s.name === 'Wrestling up')).toBe(true);
  });
});

describe('library-edit: edit, aliases, parent', () => {
  it('prefills the row; a rename keeps the old name as an alias by default', async () => {
    open({ kind: 'POSITION', id: 'pos-half' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.getByTestId('libraryEdit.title')).toHaveTextContent('Edit position');
    expect(screen.getByTestId('libraryEdit.field.name').props.value).toBe('Half guard');
    expect(screen.queryByTestId('libraryEdit.keepAlias')).toBeNull();
    await type('libraryEdit.field.name', 'Half guard top');
    const keep = screen.getByTestId('libraryEdit.keepAlias');
    expect(keep).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Changes saved');
    expect(positions.find((p) => p.id === 'pos-half')).toMatchObject({ canonicalName: 'Half guard top' });
    expect(tax().aliasRows('pos-half').map((a) => a.name)).toContain('Half guard');
  });

  it('unticking "keep alias" renames without an alias', async () => {
    open({ kind: 'POSITION', id: 'pos-half' });
    await renderScreen(<LibraryEditSheet />);
    await type('libraryEdit.field.name', 'Half guard top');
    await fireEvent.press(screen.getByTestId('libraryEdit.keepAlias'));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    await screen.findByTestId('toast.message');
    expect(tax().aliasRows('pos-half').map((a) => a.name)).not.toContain('Half guard');
  });

  it('adds an alias at once, rejects a duplicate, removes one with an inline Undo', async () => {
    open({ kind: 'POSITION', id: 'pos-half' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.getByTestId('libraryEdit.alias.al-pos-half-0')).toHaveTextContent('Half');
    await fireEvent.press(screen.getByTestId('libraryEdit.aliases.add'));
    await type('libraryEdit.alias.input', 'Deep half');
    await fireEvent.press(screen.getByTestId('libraryEdit.alias.submit'));
    expect(await screen.findByText('Deep half')).toBeTruthy();
    await type('libraryEdit.alias.input', 'deep half');
    await fireEvent.press(screen.getByTestId('libraryEdit.alias.submit'));
    expect(await screen.findByTestId('libraryEdit.alias.error')).toHaveTextContent('This entry already has that name or alias.');

    await fireEvent.press(screen.getByTestId('libraryEdit.alias.al-pos-half-0'));
    expect(screen.queryByTestId('libraryEdit.alias.al-pos-half-0')).toBeNull();
    expect(await screen.findByText(has('Removed “Half”'))).toBeTruthy();
    await fireEvent.press(screen.getByTestId('libraryEdit.alias.undo'));
    expect(await screen.findByTestId('libraryEdit.alias.al-pos-half-0')).toBeTruthy();
  });

  it('picks a variant parent through the position search, and clears it again', async () => {
    open({ kind: 'POSITION', id: 'pos-half' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.queryByTestId('libraryEdit.parent.result.pos-half')).toBeNull();
    await fireEvent.press(await screen.findByTestId('libraryEdit.parent.result.pos-closed'));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    await screen.findByTestId('toast.message');
    expect(positions.find((p) => p.id === 'pos-half')!.parentId).toBe('pos-closed');
  });

  it('the parent cycle error is shown in the banner', async () => {
    open({ kind: 'POSITION', id: 'pos-half' });
    await renderScreen(<LibraryEditSheet />, () => { positions.find((p) => p.id === 'pos-closed')!.parentId = 'pos-half'; });
    await fireEvent.press(await screen.findByTestId('libraryEdit.parent.result.pos-closed'));
    await fireEvent.press(screen.getByTestId('libraryEdit.save'));
    expect(await screen.findByTestId('libraryEdit.error')).toHaveTextContent(has('That position is a variant of this one'));
  });

  it('edits a technique: prefilled endpoints and type', async () => {
    open({ kind: 'TECHNIQUE', id: 'tec-scissor' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.getByTestId('libraryEdit.from.selected')).toHaveTextContent('Closed guard');
    expect(screen.getByTestId('libraryEdit.to.selected')).toHaveTextContent('Mount');
    expect(screen.getByTestId('libraryEdit.type.SWEEP')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.getByTestId('libraryEdit.perspective.BOTTOM')).toHaveProp('accessibilityState', { selected: true });
    await fireEvent.press(screen.getByTestId('libraryEdit.to.selected'));
    expect(screen.queryByTestId('libraryEdit.to.selected')).toBeNull();
    expect(screen.getByTestId('libraryEdit.save.reason')).toHaveTextContent('Pick the target position to save.');
  });

  it('shows a not-found state with Cancel for a missing row', async () => {
    open({ kind: 'POSITION', id: 'pos-gone' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.getByTestId('libraryEdit.notFound')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('libraryEdit.notFound.cancel'));
    expect(router.back).toHaveBeenCalled();
  });
});

describe('library-edit: delete and merge', () => {
  it('deletes, returns to the Library and offers Undo', async () => {
    open({ kind: 'POSITION', id: 'pos-turtle' });
    await renderScreen(<LibraryEditSheet />);
    await fireEvent.press(screen.getByTestId('libraryEdit.delete'));
    expect(router.dismissTo).toHaveBeenCalledWith('/library');
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Position deleted');
    expect(positions.some((p) => p.id === 'pos-turtle')).toBe(false);
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(positions.some((p) => p.id === 'pos-turtle')).toBe(true);
  });

  it('merges inline: pick the survivor, confirm, toast with Undo; the loser becomes an alias', async () => {
    open({ kind: 'POSITION', id: 'pos-turtle' });
    await renderScreen(<LibraryEditSheet />);
    await fireEvent.press(screen.getByTestId('libraryEdit.merge'));
    expect(screen.getByTestId('libraryEdit.merge.panel')).toBeTruthy();
    expect(screen.getByTestId('libraryEdit.title')).toHaveTextContent('Merge Turtle');
    expect(screen.getByTestId('libraryEdit.merge.confirm')).toHaveProp('accessibilityState', expect.objectContaining({ disabled: true }));
    expect(screen.queryByTestId('libraryEdit.merge.result.pos-turtle')).toBeNull();
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.result.pos-back'));
    expect(screen.getByTestId('libraryEdit.merge.result.pos-back')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.getByText('Turtle → Back control')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.confirm'));
    expect(router.dismissTo).toHaveBeenCalledWith('/library');
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Merged into Back control');
    expect(positions.some((p) => p.id === 'pos-turtle')).toBe(false);
    expect(tax().aliasRows('pos-back').map((a) => a.name)).toContain('Turtle');
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(await screen.findByText('Merge undone')).toBeTruthy();
    expect(positions.some((p) => p.id === 'pos-turtle')).toBe(true);
    expect(tax().aliasRows('pos-back').map((a) => a.name)).not.toContain('Turtle');
  });

  it('Back to editing returns to the form', async () => {
    open({ kind: 'POSITION', id: 'pos-turtle' });
    await renderScreen(<LibraryEditSheet />);
    await fireEvent.press(screen.getByTestId('libraryEdit.merge'));
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.back'));
    expect(screen.getByTestId('libraryEdit.field.name')).toBeTruthy();
  });

  it('a submission only offers other submissions as the survivor', async () => {
    open({ kind: 'TECHNIQUE', id: 'tec-kimura' });
    await renderScreen(<LibraryEditSheet />);
    await fireEvent.press(screen.getByTestId('libraryEdit.merge'));
    expect(screen.getByTestId('libraryEdit.merge.result.tec-armbar')).toBeTruthy();
    expect(screen.queryByTestId('libraryEdit.merge.result.tec-scissor')).toBeNull();
    expect(screen.queryByTestId('libraryEdit.merge.result.tec-kimura')).toBeNull();
  });

  it('merges a subject (no aliases) and an undo that is no longer allowed shows its error toast', async () => {
    open({ kind: 'SUBJECT', id: 'sub-escapes' });
    await renderScreen(<LibraryEditSheet />);
    expect(screen.queryByTestId('libraryEdit.aliases.add')).toBeNull();
    await fireEvent.press(screen.getByTestId('libraryEdit.merge'));
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.result.sub-grips'));
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.confirm'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Merged into Grip fighting');
    await act(async () => { tax().merge('SUBJECT', 'sub-grips', 'sub-pressure'); });
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(await screen.findByText(has('A later merge involves one of these entries'))).toBeTruthy();
  });

  it('a self-merge or kind mismatch error reaches the banner', async () => {
    open({ kind: 'POSITION', id: 'pos-turtle' });
    await renderScreen(<LibraryEditSheet />);
    await fireEvent.press(screen.getByTestId('libraryEdit.merge'));
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.result.pos-back'));
    mockStore.taxonomy.softDelete('POSITION', 'pos-back');
    await fireEvent.press(screen.getByTestId('libraryEdit.merge.confirm'));
    expect(await screen.findByTestId('libraryEdit.error')).toHaveTextContent(has('This entry was deleted'));
  });
});

describe('Technique detail', () => {
  it('shows the edge, aliases, notes, resources and history', async () => {
    await renderScreen(<TechniqueDetailScreen id="tec-scissor" />, () => { tax().notes.set('tec-scissor', 'Hip out first.'); });
    expect(screen.getByText('Scissor sweep')).toBeTruthy();
    expect(screen.getByTestId('technique.from')).toHaveTextContent('From Closed guard');
    expect(screen.getByTestId('technique.to')).toHaveTextContent('To Mount');
    expect(screen.getByText('Hip out first.')).toBeTruthy();
    expect(screen.getByText(has('from bottom'))).toBeTruthy();
    expect(screen.getByTestId('technique.resource.res-1')).toHaveTextContent(has('Scissor sweep details'));
    expect(screen.getByTestId('technique.resource.res-1')).toHaveTextContent(has('Video · Coach Ada'));
    expect(screen.getByTestId('technique.history.ses-last')).toHaveTextContent(has('Attached to a focus'));
    expect(screen.getByTestId('technique.history.ses-old')).toHaveTextContent(has('Submission in sparring'));
    await fireEvent.press(screen.getByTestId('technique.from'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library/position/[id]', params: { id: 'pos-closed' } });
    await fireEvent.press(screen.getByTestId('technique.history.ses-last'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/session/[id]', params: { id: 'ses-last' } });
  });

  it('a submission shows no target; empty resources and history say what to do', async () => {
    await renderScreen(<TechniqueDetailScreen id="tec-kimura" />);
    expect(screen.queryByTestId('technique.to')).toBeNull();
    expect(screen.getByTestId('technique.resources.empty')).toBeTruthy();
    expect(screen.getByTestId('technique.history.empty')).toHaveTextContent(has('Attach this technique to a focus'));
    expect(screen.getByText(has('No notes yet'))).toBeTruthy();
    expect(screen.getByText(has('Double wrist lock'))).toBeTruthy();
  });

  it('renders a soft-deleted endpoint as "(removed)" without a link', async () => {
    await renderScreen(<TechniqueDetailScreen id="tec-scissor" />);
    await act(async () => { tax().softDelete('POSITION', 'pos-mount'); });
    expect(screen.getByTestId('technique.to')).toHaveTextContent('Mount (removed)');
    await fireEvent.press(screen.getByTestId('technique.to'));
    expect(router.push).not.toHaveBeenCalledWith(expect.objectContaining({ params: { id: 'pos-mount' } }));
  });

  it('toggles Watched, opens the link, and routes Add / Edit / row taps', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderScreen(<TechniqueDetailScreen id="tec-scissor" />);
    expect(screen.getByTestId('technique.resource.res-1.watched')).toHaveProp('accessibilityState', expect.objectContaining({ checked: false }));
    await fireEvent.press(screen.getByTestId('technique.resource.res-1.watched'));
    expect(progressStore.resources['tec-scissor']!.find((r) => r.id === 'res-1')!.status).toBe('WATCHED');
    expect(screen.getByTestId('technique.resource.res-1.watched')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.queryByTestId('technique.resource.res-2.open')).toBeNull();
    await fireEvent.press(screen.getByTestId('technique.resource.res-1.open'));
    expect(openUrl).toHaveBeenCalledWith('https://example.com/scissor');
    await fireEvent.press(screen.getByTestId('technique.resources.add'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/resource-edit', params: { techniqueId: 'tec-scissor' } });
    await fireEvent.press(screen.getByTestId('technique.resource.res-2'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/resource-edit', params: { id: 'res-2', techniqueId: 'tec-scissor' } });
    await fireEvent.press(screen.getByTestId('technique.edit'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/library-edit', params: { kind: 'TECHNIQUE', id: 'tec-scissor' } });
    openUrl.mockRestore();
  });

  it('shows loading and not-found', async () => {
    await renderScreen(<TechniqueDetailScreen id="tec-gone" />);
    expect(screen.getByTestId('technique.notFound')).toHaveTextContent(has('Technique not found'));
    await act(async () => { progressStore.forced = 'loading'; progressStore.emit(); });
    expect(screen.getByTestId('technique.loading')).toBeTruthy();
  });
});

describe('resource-edit', () => {
  it('needs a title, then adds a resource with an Undo toast', async () => {
    open({ techniqueId: 'tec-kimura' });
    await renderScreen(<ResourceEditSheet />);
    expect(screen.getByTestId('resourceEdit.heading')).toHaveTextContent('Add resource');
    expect(screen.getByTestId('resourceEdit.save.reason')).toHaveTextContent('Enter a title to save.');
    expect(screen.getByTestId('resourceEdit.type.rt-video')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    await type('resourceEdit.field.title', 'Kimura trap');
    await fireEvent.press(screen.getByTestId('resourceEdit.type.rt-course'));
    await fireEvent.press(screen.getByTestId('resourceEdit.status.WATCHED'));
    await fireEvent.press(screen.getByTestId('resourceEdit.save'));
    expect(router.back).toHaveBeenCalled();
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Resource added');
    expect(progressStore.resources['tec-kimura']![0]).toMatchObject({ title: 'Kimura trap', resourceTypeName: 'Course', status: 'WATCHED', origin: 'user' });
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(progressStore.resources['tec-kimura']).toHaveLength(0);
  });

  it('rejects a link that is not http(s) in the banner', async () => {
    open({ techniqueId: 'tec-kimura' });
    await renderScreen(<ResourceEditSheet />);
    await type('resourceEdit.field.title', 'Notes');
    await type('resourceEdit.field.url', 'ftp://example.com/x');
    await fireEvent.press(screen.getByTestId('resourceEdit.save'));
    expect(await screen.findByTestId('resourceEdit.error')).toHaveTextContent(has('starts with http:// or https://'));
    expect(router.back).not.toHaveBeenCalled();
  });

  it('edit mode prefills, saves, and deletes with Undo', async () => {
    open({ id: 'res-1', techniqueId: 'tec-scissor' });
    await renderScreen(<ResourceEditSheet />);
    expect(screen.getByTestId('resourceEdit.heading')).toHaveTextContent('Edit resource');
    expect(screen.getByTestId('resourceEdit.field.title').props.value).toBe('Scissor sweep details');
    expect(screen.getByTestId('resourceEdit.field.author').props.value).toBe('Coach Ada');
    await type('resourceEdit.field.author', 'Coach Ada B.');
    await fireEvent.press(screen.getByTestId('resourceEdit.save'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Changes saved');
    expect(progressStore.resources['tec-scissor']!.find((r) => r.id === 'res-1')!.author).toBe('Coach Ada B.');

    await act(async () => { progressStore.reset(); });
    await fireEvent.press(screen.getByTestId('resourceEdit.delete'));
    expect(await screen.findByTestId('toast.message')).toHaveTextContent('Resource deleted');
    expect(progressStore.resources['tec-scissor']!.some((r) => r.id === 'res-1')).toBe(false);
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(progressStore.resources['tec-scissor']!.some((r) => r.id === 'res-1')).toBe(true);
  });

  it('has no delete when adding', async () => {
    open({ techniqueId: 'tec-kimura' });
    await renderScreen(<ResourceEditSheet />);
    expect(screen.queryByTestId('resourceEdit.delete')).toBeNull();
  });
});
