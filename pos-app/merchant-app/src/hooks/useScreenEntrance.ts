import { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');

export function useScreenEntrance() {
  const barX    = useRef(new Animated.Value(-W)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formY    = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      // accent bar slides in from left
      Animated.timing(barX, {
        toValue: 0,
        duration: 650,
        delay: 60,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      // form fades + rises
      Animated.sequence([
        Animated.delay(220),
        Animated.parallel([
          Animated.timing(formFade, { toValue: 1, duration: 500, easing: ease, useNativeDriver: true }),
          Animated.timing(formY,    { toValue: 0, duration: 480, easing: ease, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return { barX, formFade, formY };
}
