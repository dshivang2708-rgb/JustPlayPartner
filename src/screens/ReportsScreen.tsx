import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SegmentedControl } from '../components/SegmentedControl';
import { ReportCard } from '../components/ReportCard';
import { Button } from '../components/Button';
import { color, font, spacing } from '../theme/tokens';
import { REPORT_PERIODS, ReportPeriod, GeneratedReport } from '../data/reportsData';
import { fetchReports, generateReport, getPeriodRange } from '../services/reportsService';

export function ReportsScreen({ navigation }: { navigation: any }) {
  const [period, setPeriod] = useState<ReportPeriod>('Monthly');
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await fetchReports(period));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReport(period);
      load();
    } catch (e) {
      Alert.alert('Could not generate report', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const currentLabel = getPeriodRange(period).label;

  return (
    <ScreenScaffold title="Report center" subtitle="Auto-generated performance reports">
      <SegmentedControl
        options={REPORT_PERIODS.map((p) => ({ key: p, label: p }))}
        selectedKey={period}
        onChange={(k) => setPeriod(k as ReportPeriod)}
      />

      <Button
        label={generating ? 'Generating…' : `Generate report for ${currentLabel}`}
        variant="primary"
        loading={generating}
        onPress={handleGenerate}
        fullWidth
      />

      {loading ? (
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.lg }} />
      ) : error ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={load} style={{ marginTop: spacing.sm }} />
        </View>
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No {period.toLowerCase()} reports generated yet.</Text>
      ) : (
        reports.map((report) => (
          <ReportCard key={report.id} report={report} onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })} />
        ))
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.lg },
});