import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from './Card';
import { color, font, radius, spacing } from '../theme/tokens';
import { GeneratedReport } from '../data/reportsData';

export function ReportCard({ report, onPress }: { report: GeneratedReport; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.pdfIcon}>
          <Text style={styles.pdfIconText}>PDF</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.period}>{report.periodLabel}</Text>
          <Text style={styles.generated}>Generated {report.generatedDateLabel}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfIconText: { fontFamily: font.sansBold, fontSize: 10, color: color.danger },
  period: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  generated: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  chevron: { fontFamily: font.sansSemiBold, fontSize: 20, color: color.textOnLightFaint },
});