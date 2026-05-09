import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'dark' | 'light';

interface Props {
  size?: Size;
  variant?: Variant;
}

const CONFIG = {
  sm: { maxH: 28, barW: 7,  gap: 3, meroSz: 20, bizSz: 7,  spacing: 10 },
  md: { maxH: 44, barW: 11, gap: 4, meroSz: 32, bizSz: 10, spacing: 14 },
  lg: { maxH: 60, barW: 15, gap: 6, meroSz: 44, bizSz: 13, spacing: 18 },
};

const BAR_RATIOS = [
  { ratio: 0.424, opacity: 0.5 },
  { ratio: 0.667, opacity: 0.72 },
  { ratio: 1.0,   opacity: 1.0 },
  { ratio: 0.667, opacity: 0.72 },
  { ratio: 0.424, opacity: 0.5 },
];

export default function MeroLogo({ size = 'md', variant = 'dark' }: Props) {
  const c = CONFIG[size];
  const totalW = BAR_RATIOS.length * c.barW + (BAR_RATIOS.length - 1) * c.gap;
  const bizColor = variant === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.38)';

  return (
    <View style={styles.row}>
      <Svg width={totalW} height={c.maxH} viewBox={`0 0 ${totalW} ${c.maxH}`}>
        <Defs>
          <LinearGradient id="mbg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4ADE80" stopOpacity="1" />
            <Stop offset="1" stopColor="#059669" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {BAR_RATIOS.map((bar, i) => {
          const h = bar.ratio * c.maxH;
          const x = i * (c.barW + c.gap);
          const y = c.maxH - h;
          return (
            <Rect
              key={i}
              x={x} y={y}
              width={c.barW} height={h}
              rx={c.barW / 2}
              fill="url(#mbg)"
              opacity={bar.opacity}
            />
          );
        })}
      </Svg>

      <View style={[styles.wordmark, { marginLeft: c.spacing }]}>
        <Text style={[styles.mero, { fontSize: c.meroSz }]}>mero</Text>
        <Text style={[styles.business, { fontSize: c.bizSz, color: bizColor }]}>BUSINESS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  wordmark: { flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 },
  mero: { color: '#4ADE80', fontWeight: '900', letterSpacing: -1.5 },
  business: { fontWeight: '500', letterSpacing: 5, marginTop: 3 },
});
