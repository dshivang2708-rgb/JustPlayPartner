import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SegmentedControl } from '../components/SegmentedControl';
import { ReportCard } from '../components/ReportCard';
import { color, font } from '../theme/tokens';
import { generatedReports, REPORT_PERIODS, ReportPeriod } from '../data/reportsData';

export function ReportsScreen({ navigation }: { navigation: any }) {
  const [period, setPeriod] = useState<ReportPeriod>('Monthly');

  const filtered = useMemo(() => generatedReports.filter((r) => r.period === period), [period]);

  return (
    <ScreenScaffold title="Report center" subtitle="Auto-generated performance reports">
      <SegmentedControl
        options={REPORT_PERIODS.map((p) => ({ key: p, label: p }))}
        selectedKey={period}
        onChange={(k) => setPeriod(k as ReportPeriod)}
      />

      {filtered.length === 0 ? (
        <Text style={{ fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: 24 }}>
          No {period.toLowerCase()} reports generated yet.
        </Text>
      ) : (
        filtered.map((report) => (
          <ReportCard key={report.id} report={report} onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })} />
        ))
      )}
    </ScreenScaffold>
  );
}