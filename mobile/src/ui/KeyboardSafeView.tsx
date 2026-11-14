import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, LayoutAnimation, Platform, View, type HostInstance, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Keeps the bottom of a screen above the keyboard.
 *
 * KeyboardAvoidingView assumes its view starts at the top of the screen. Inside a form sheet
 * ("Order baru", "Catat restok") it does not, so the footer button ended up behind the keyboard.
 * Here we measure where this view really ends on screen and pad by exactly the part the keyboard covers.
 */
export function KeyboardSafeView({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const ref = useRef<HostInstance>(null);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const change = Keyboard.addListener('keyboardWillChangeFrame', e => {
      ref.current?.measureInWindow((_x, y, _w, h) => {
        const overlap = Math.max(0, y + h - e.endCoordinates.screenY);
        LayoutAnimation.configureNext(LayoutAnimation.create(e.duration || 250, 'keyboard' as never, 'opacity'));
        setInset(overlap);
      });
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => setInset(0));
    return () => { change.remove(); hide.remove(); };
  }, []);

  return <View ref={ref} style={[style, inset ? { paddingBottom: inset } : null]}>{children}</View>;
}
