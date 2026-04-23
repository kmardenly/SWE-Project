import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Svg, Rect } from 'react-native-svg';

export default function PicnicBackground() {
  const { width, height } = useWindowDimensions();
  const horizontalStripeCount = Math.ceil(height / 40) + 1;
  const verticalStripeCount = Math.ceil(width / 40) + 1;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        {/* Base yellow */}
        <Rect width="100%" height="100%" fill="#FFD5D6" />
        {/* Horizontal stripes */}
        {Array.from({ length: horizontalStripeCount }).map((_, i) => (
          <Rect
            key={`h${i}`}
            x="0" y={i * 40}
            width="100%" height="20"
            fill="rgba(255, 255, 255, 0.21)"
          />
        ))}
        {/* Vertical stripes */}
        {Array.from({ length: verticalStripeCount }).map((_, i) => (
          <Rect
            key={`v${i}`}
            x={i * 40} y="0"
            width="20" height="100%"
            fill="hsla(0, 0.00%, 94.10%, 0.54)"
          />
        ))}
      </Svg>
    </View>
  );
}