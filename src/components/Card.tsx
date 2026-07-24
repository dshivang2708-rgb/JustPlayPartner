import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { color, radius, shadow, spacing } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  raised?: boolean;
};

/** Standard white rounded-corner card with ambient shadow — every data module sits in one of these. */
export function Card({ children, style, padded = true, raised = false }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          padding: padded ? spacing.md : 0,
        },
        raised ? shadow.cardRaised : shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
