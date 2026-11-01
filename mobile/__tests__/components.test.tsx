import { fireEvent, render, screen } from '@testing-library/react-native';
import { act, useState } from 'react';

import '../src/i18n';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { ScalePicker } from '../src/components/ScalePicker';
import { Stepper } from '../src/components/Stepper';
import { ToastHost, toast } from '../src/components/Toast';
import { hapticStepper } from '../src/hooks/haptics';

jest.mock('../src/hooks/haptics', () => ({ hapticStepper: jest.fn(), hapticSave: jest.fn() }));

function Harness({ initial, firstValue, min = 0, max = 3 }: { initial?: number; firstValue?: number; min?: number; max?: number }) {
  const [v, setV] = useState<number | undefined>(initial);
  return <Stepper value={v} onChange={setV} min={min} max={max} firstValue={firstValue} unsetText="–" lessLabel="less" moreLabel="more" testIDPrefix="s" label="Count" />;
}

describe('Stepper', () => {
  it('disables the button at its limit (DSR-6) and ticks a haptic per change', async () => {
    await render(<Harness initial={2} />);
    await fireEvent.press(screen.getByTestId('s.more'));
    expect(screen.getByTestId('s.value')).toHaveTextContent('3');
    expect(screen.getByTestId('s.more')).toBeDisabled();
    expect(hapticStepper).toHaveBeenCalledTimes(1);
  });

  it('untouched counts show the unset text; the first touch sets min + step', async () => {
    await render(<Harness />);
    expect(screen.getByTestId('s.value')).toHaveTextContent('–');
    expect(screen.getByTestId('s.less')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('s.more'));
    expect(screen.getByTestId('s.value')).toHaveTextContent('1');
  });

  it('exposes adjustable semantics with min/max/now', async () => {
    await render(<Harness initial={1} />);
    const value = screen.getByTestId('s.value');
    expect(value).toHaveProp('accessibilityRole', 'adjustable');
    expect(value).toHaveProp('accessibilityValue', { min: 0, max: 3, now: 1 });
    await act(async () => value.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }));
    expect(screen.getByTestId('s.value')).toHaveTextContent('2');
  });
});

describe('ScalePicker', () => {
  it('fills levels up to the value and clears on re-tap', async () => {
    const onChange = jest.fn();
    await render(<ScalePicker value={3} onChange={onChange} label="Rating" groupLabel="g" optionKind="log.label.rating" testIDPrefix="p" />);
    expect(screen.getByTestId('p.3')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
    expect(screen.getByLabelText('Rating 4 of 5')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('p.3'));
    expect(onChange).toHaveBeenCalledWith(undefined);
    await fireEvent.press(screen.getByTestId('p.5'));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

describe('Button', () => {
  it('busy ignores presses and exposes busy state', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" busy busyLabel="Saving" onPress={onPress} testID="b" />);
    await fireEvent.press(screen.getByTestId('b'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('b')).toHaveProp('accessibilityState', expect.objectContaining({ busy: true }));
    expect(screen.getByLabelText('Saving')).toBeTruthy();
  });
});

describe('Chip', () => {
  it('selected selectable chip is a checked checkbox', async () => {
    await render(<Chip variant="selectable" selected label="Trained" testID="c" />);
    expect(screen.getByTestId('c')).toHaveProp('accessibilityRole', 'checkbox');
    expect(screen.getByTestId('c')).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
  });
});

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => { toast.clear(); jest.useRealTimers(); });

  it('replaces the current toast, times out after durationToast, and Undo skips onExpire', async () => {
    await render(<ToastHost />);
    const expire = jest.fn();
    const undo = jest.fn();
    await act(async () => toast.show({ message: 'One', onExpire: expire }));
    await act(async () => toast.show({ message: 'Two', undo }));
    expect(expire).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('toast.message')).toHaveTextContent('Two');
    await fireEvent.press(screen.getByTestId('toast.undo'));
    expect(undo).toHaveBeenCalled();
    expect(screen.queryByTestId('toast')).toBeNull();

    const expire2 = jest.fn();
    await act(async () => toast.show({ message: 'Three', onExpire: expire2 }));
    await act(async () => { await Promise.resolve(); jest.advanceTimersByTime(4100); });
    expect(screen.queryByTestId('toast')).toBeNull();
    expect(expire2).toHaveBeenCalled();
  });
});
