import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { color, font, spacing } from '../theme/tokens';
import { GeneratedReport } from '../data/reportsData';
import { fetchReportById } from '../services/reportsService';

export function ReportDetailScreen({ route }: { route: any }) {
  const { reportId } = route.params;
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchReportById(reportId);
      if (!r) {
        setError('Report not found.');
      } else {
        setReport(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reportId]);

  if (loading) {
    return (
      <ScreenScaffold title="Report" subtitle="Loading…">
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.lg }} />
      </ScreenScaffold>
    );
  }

  if (error || !report) {
    return (
      <ScreenScaffold title="Report" subtitle="">
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Retry" variant="secondary" onPress={load} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title={report.periodLabel} subtitle={`Generated ${report.generatedDateLabel}`}>
      <Card style={styles.narrativeCard}>
        <Text style={styles.narrativeTag}>AUTO-GENERATED SUMMARY</Text>

        <Text style={styles.narrativeHeading}>Top wins</Text>
        {report.wins.map((w, i) => (
          <NarrativeLine key={i} index={i + 1} text={w} tone="win" />
        ))}

        <Text style={[styles.narrativeHeading, { marginTop: spacing.md }]}>Problem areas</Text>
        {report.problems.map((p, i) => (
          <NarrativeLine key={i} index={i + 1} text={p} tone="problem" />
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionHeader}>Performance breakdown</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          {report.breakdown.map((stat) => (
            <View key={stat.label} style={styles.statRow}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={[styles.statDelta, { color: stat.deltaPct >= 0 ? color.success : color.danger }]}>
                  {stat.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(stat.deltaPct)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function NarrativeLine({ index, text, tone }: { index: number; text: string; tone: 'win' | 'problem' }) {
  return (
    <View style={styles.narrativeLine}>
      <View style={[styles.narrativeBullet, tone === 'win' ? styles.bulletWin : styles.bulletProblem]}>
        <Text style={styles.narrativeBulletText}>{index}</Text>
      </View>
      <Text style={styles.narrativeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  narrativeCard: { backgroundColor: color.chromeNavy },
  narrativeTag: { fontFamily: font.sansSemiBold, fontSize: 10, letterSpacing: 0.6, color: color.gold, marginBottom: spacing.sm },
  narrativeHeading: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnDark, marginBottom: spacing.sm },
  narrativeLine: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  narrativeBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletWin: { backgroundColor: 'rgba(22,163,74,0.25)' },
  bulletProblem: { backgroundColor: 'rgba(220,38,38,0.25)' },
  narrativeBulletText: { fontFamily: font.sansBold, fontSize: 11, color: color.textOnDark },
  narrativeText: { flex: 1, fontFamily: font.sans, fontSize: 13, color: color.textOnDarkMuted, lineHeight: 19 },

  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  statLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  statValue: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight },
  statDelta: { fontFamily: font.sansSemiBold, fontSize: 11, marginTop: 2 },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});