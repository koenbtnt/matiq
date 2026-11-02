import { fireEvent, render, screen } from '@testing-library/react-native';

import '../src/i18n';
import { BeltRank, BeltSwatch } from '../src/components/BeltRank';
import { SectionHeader } from '../src/components/SectionHeader';
import { SwitchRow } from '../src/components/SwitchRow';
import { TextField } from '../src/components/TextField';
import { size } from '../src/theme/tokens';
import { colors } from '../src/theme/tokens';

describe('BeltSwatch / BeltRank on the kids scale (P-25)', () => {
  it('a split belt draws a centred 50 % band in white or black over the fill', async () => {
    await render(<BeltSwatch belt="GREY_BLACK" />);
    const swatch = screen.toJSON() as unknown as { props: { style: Record<string, unknown> }; children: { props: { style: Record<string, unknown> } }[] };
    expect(swatch.props.style).toMatchObject({ backgroundColor: colors.light.beltKidsGrey, borderColor: colors.light.beltKidsGrey });
    expect(swatch.children[0]!.props.style).toMatchObject({ height: size.beltSwatchHeight / 2, backgroundColor: colors.light.beltBlack });
  });

  it('a plain kids belt has no band; white and black keep the strong edge (R-T4)', async () => {
    await render(<BeltSwatch belt="YELLOW" />);
    expect((screen.toJSON() as unknown as { children: unknown[] }).children ?? []).toHaveLength(0);
    await screen.rerender(<BeltSwatch belt="WHITE" />);
    expect((screen.toJSON() as unknown as { props: { style: Record<string, unknown> } }).props.style).toMatchObject({ borderColor: colors.light.borderStrong });
  });

  it('the large belt shows the band beneath the bar and stripes', async () => {
    await render(<BeltRank belt="GREEN_WHITE" stripes={2} />);
    const json = screen.toJSON() as unknown as { children: { props: { style: unknown } }[] };
    expect(json.children).toHaveLength(3);
    expect(JSON.stringify(json.children[0]!.props.style)).toContain(colors.light.beltWhite);
  });
});

describe('SwitchRow', () => {
  it('is one switch stop with label and hint, toggling on press; the inner Switch is hidden', async () => {
    const onChange = jest.fn();
    await render(<SwitchRow testID="row" label="Detailed rounds" hint="Saved now." value={false} onValueChange={onChange} />);
    const row = screen.getByTestId('row');
    expect(row).toHaveProp('accessibilityRole', 'switch');
    expect(row).toHaveProp('accessibilityLabel', 'Detailed rounds. Saved now.');
    expect(row).toHaveProp('accessibilityState', { checked: false });
    await fireEvent.press(row);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('TextField', () => {
  it('shows a caption label, forwards typing and blur, and can hide the caption beside another control', async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();
    await render(<TextField label="Title" testID="field" value="" onChangeText={onChange} onBlur={onBlur} />);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByTestId('field')).toHaveProp('accessibilityLabel', 'Title');
    await fireEvent.changeText(screen.getByTestId('field'), 'abc');
    expect(onChange).toHaveBeenCalledWith('abc');
    await fireEvent(screen.getByTestId('field'), 'focus');
    expect(screen.getByTestId('field')).toHaveStyle({ borderColor: colors.light.accentBorder, borderWidth: size.borderWidthFocus });
    await fireEvent(screen.getByTestId('field'), 'blur');
    expect(onBlur).toHaveBeenCalled();
    await screen.rerender(<TextField label="Title" hideLabel accessibilityLabel="Title: type a value" testID="field" value="" onChangeText={onChange} />);
    expect(screen.queryByText('Title')).toBeNull();
    expect(screen.getByTestId('field')).toHaveProp('accessibilityLabel', 'Title: type a value');
  });
});

describe('SectionHeader', () => {
  it('renders a header with an optional trailing link action', async () => {
    const onPress = jest.fn();
    await render(<SectionHeader title="Resources" action={{ label: 'Add', accessibilityLabel: 'Add a resource', onPress, testID: 'add' }} />);
    expect(screen.getByText('Resources')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('add'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('add')).toHaveProp('accessibilityRole', 'link');
  });
});

describe('SheetChrome (A-1)', () => {
  it('is opaque and stacked above the scroll body so the header stays visible and tappable', async () => {
    const { SheetChrome } = require('../src/components/SheetChrome') as typeof import('../src/components/SheetChrome');
    await render(<SheetChrome title="T" onCancel={() => undefined} cancelTestID="x.cancel" titleTestID="x.title" />);
    const root = screen.toJSON() as unknown as { props: { style: unknown } };
    const style = Object.assign({}, ...[root.props.style].flat(Infinity as 1).filter(Boolean)) as Record<string, unknown>;
    expect(style).toMatchObject({ backgroundColor: colors.light.bgSurface, zIndex: 1 });
  });

  it('SheetBody clips the scroll area below the header', async () => {
    const { SheetBody } = require('../src/components/SheetChrome') as typeof import('../src/components/SheetChrome');
    await render(<SheetBody><TextField label="x" testID="x" value="" onChangeText={() => undefined} /></SheetBody>);
    expect((screen.toJSON() as unknown as { props: { style: unknown } }).props.style).toMatchObject({ flex: 1, overflow: 'hidden' });
  });
});
