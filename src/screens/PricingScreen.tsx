import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { SegmentedControl } from '../components/SegmentedControl';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import { PriceHistoryEntry } from '../components/PriceHistoryEntry';
import { color, font, spacing } from '../theme/tokens';
import { courtPricing, priceChangeHistory, EngineMode, CourtPricing } from '../data/pricingData';

const ENGINE_MODES: { key: EngineMode; label: string }[] = [
  { key: 'Manual', label: 'Manual' },
  { key: 'Assisted', label: 'Assisted' },
  { key: 'Auto', label: 'Auto' },
];

const ENGINE_MODE_DESCRIPTIONS: Record<EngineMode, string> = {
  Manual: 'You set every price yourself. Nothing changes automatically.',
  Assisted: 'We suggest price changes based on demand — you approve each one before it goes live.',
  Auto: 'Prices adjust automatically within the min/max range you set below, based on real-time demand.',
};

export function PricingScreen() {
  const [engineMode, setEngineMode] = useState<EngineMode>('Assisted');
  const [pricing, setPricing] = useState<CourtPricing[]>(courtPricing);

  const updateCourtRange = (courtId: string, minPrice: number, maxPrice: number) => {
    setPricing((prev) => prev.map((c) => (c.courtId === courtId ? { ...c, minPrice, maxPrice } : c)));
  };

  return (
    <ScreenScaffold title="Pricing rules" subtitle="Min/max ranges and engine mode per court">
      {/* Engine mode */}
      <Card>
        <Text style={styles.sectionHeader}>Pricing engine mode</Text>
        <View style={{ marginTop: spacing.sm }}>
          <SegmentedControl
            options={ENGINE_MODES}
            selectedKey={engineMode}
            onChange={(k) => setEngineMode(k as EngineMode)}
          />
        </View>
        <Text style={styles.modeDescription}>{ENGINE_MODE_DESCRIPTIONS[engineMode]}</Text>
      </Card>

      {/* Per-court sliders */}
      {pricing.map((court) => (
        <Card key={court.courtId}>
          <Text style={styles.courtName}>{court.courtName}</Text>
          <Text style={styles.currentPrice}>
            Current price: <Text style={styles.currentPriceValue}>₹{court.currentPrice}</Text>
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <PriceRangeSlider
              floor={court.floor}
              ceiling={court.ceiling}
              minValue={court.minPrice}
              maxValue={court.maxPrice}
              onChange={(min, max) => updateCourtRange(court.courtId, min, max)}
            />
          </View>
        </Card>
      ))}

      {/* Price change history */}
      <Card>
        <Text style={styles.sectionHeader}>Price-change history</Text>
        <View style={{ marginTop: spacing.md }}>
          {priceChangeHistory.map((entry, i) => (
            <PriceHistoryEntry key={entry.id} entry={entry} isLast={i === priceChangeHistory.length - 1} />
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  modeDescription: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: spacing.sm, lineHeight: 17 },
  courtName: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight },
  currentPrice: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  currentPriceValue: { fontFamily: font.sansSemiBold, color: color.textOnLight },
});