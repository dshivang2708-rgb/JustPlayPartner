import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EditVenueModal } from '../components/EditVenueModal';
import { AddEditCourtModal } from '../components/AddEditCourtModal';
import { color, font, radius, spacing } from '../theme/tokens';
import { fetchVenueById, VenueRecord } from '../services/venuesService';
import { fetchCourtsForVenue, CourtRecord } from '../services/courtsService';
import { pickImage, addVenueCoverImage, removeVenueCoverImage } from '../services/imagesService';

type RouteParams = { VenueDetail: { venueId: string } };

function formatHour(t: string) {
  const h = parseInt(t.slice(0, 2), 10);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12} ${suffix}`;
}

export function VenueDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'VenueDetail'>>();
  const navigation = useNavigation<any>();
  const { venueId } = route.params;

  const [venue, setVenue] = useState<VenueRecord | null>(null);
  const [courts, setCourts] = useState<CourtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editVenueVisible, setEditVenueVisible] = useState(false);
  const [courtModalVisible, setCourtModalVisible] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtRecord | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v, c] = await Promise.all([fetchVenueById(venueId), fetchCourtsForVenue(venueId)]);
      setVenue(v);
      setCourts(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this venue.');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    load();
  }, [load]);

  const openAddCourt = () => {
    setEditingCourt(null);
    setCourtModalVisible(true);
  };
  const openEditCourt = (court: CourtRecord) => {
    setEditingCourt(court);
    setCourtModalVisible(true);
  };

  const handleAddPhoto = async () => {
    if (!venue) return;
    try {
      const localUri = await pickImage();
      if (!localUri) return; // user cancelled
      setUploadingPhoto(true);
      const nextUrls = await addVenueCoverImage(venue.id, localUri);
      setVenue({ ...venue, coverImageUrls: nextUrls });
    } catch (e) {
      Alert.alert('Could not upload photo', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (url: string) => {
    if (!venue) return;
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const nextUrls = await removeVenueCoverImage(venue.id, url);
            setVenue({ ...venue, coverImageUrls: nextUrls });
          } catch (e) {
            Alert.alert('Could not remove photo', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenScaffold title="Venue">
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.xl }} />
      </ScreenScaffold>
    );
  }

  if (error || !venue) {
    return (
      <ScreenScaffold title="Venue">
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error ?? 'Venue not found.'}</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={load} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title={venue.name}
      subtitle={venue.address}
      rightAction={
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      }
    >
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.venueHeaderRow}>
          <StatusBadge label={venue.isActive ? 'Active' : 'Inactive'} tone={venue.isActive ? 'success' : 'neutral'} />
          <Pressable onPress={() => setEditVenueVisible(true)}>
            <Text style={styles.editLink}>Edit venue</Text>
          </Pressable>
        </View>
        <Text style={styles.sportsLabel}>{venue.sports.join(', ') || 'No sports listed yet'}</Text>
        <Text style={styles.courtCountLabel}>{courts.length} turf{courts.length === 1 ? '' : 's'}</Text>
        {!venue.isActive && (
          <Text style={styles.inactiveWarning}>
            This venue is hidden from the consumer app, including all its turfs, until you reactivate it.
          </Text>
        )}
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Photos</Text>
        {uploadingPhoto ? (
          <ActivityIndicator size="small" color={color.gold} />
        ) : (
          <Pressable onPress={handleAddPhoto} style={styles.addButton} hitSlop={8}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        )}
      </View>

      {venue.coverImageUrls.length === 0 ? (
        <Text style={styles.emptyText}>No photos yet — tap + to add your first one. Photos show up on the consumer app immediately.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {venue.coverImageUrls.map((url) => (
            <View key={url} style={styles.photoThumbWrap}>
              <Image source={{ uri: url }} style={styles.photoThumb} />
              <Pressable onPress={() => handleRemovePhoto(url)} style={styles.photoRemoveButton} hitSlop={8}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Turfs / Courts</Text>
        <Pressable onPress={openAddCourt} style={styles.addButton} hitSlop={8}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {courts.length === 0 ? (
        <Text style={styles.emptyText}>No turfs yet — tap + to add one so customers can book here.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {courts.map((c) => (
            <Card key={c.id} style={{ gap: 4 }}>
              <View style={styles.courtRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courtName}>{c.name}</Text>
                  <Text style={styles.courtMeta}>
                    {c.sport} · ₹{c.basePrice}/hr · {formatHour(c.openingTime)} – {formatHour(c.closingTime)}
                  </Text>
                </View>
                <StatusBadge label={c.isActive ? 'Active' : 'Inactive'} tone={c.isActive ? 'success' : 'neutral'} />
              </View>
              <Pressable onPress={() => openEditCourt(c)} style={styles.courtEditButton}>
                <Text style={styles.courtEditText}>Edit</Text>
              </Pressable>
            </Card>
          ))}
        </View>
      )}

      <EditVenueModal
        visible={editVenueVisible}
        venue={venue}
        onClose={() => setEditVenueVisible(false)}
        onUpdated={(updated) => setVenue(updated)}
      />

      <AddEditCourtModal
        visible={courtModalVisible}
        venueId={venue.id}
        editingCourt={editingCourt}
        onClose={() => setCourtModalVisible(false)}
        onCreated={(court) => setCourts((prev) => [...prev, court])}
        onUpdated={(court) => setCourts((prev) => prev.map((c) => (c.id === court.id ? court : c)))}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingVertical: 4 },
  backText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },

  venueHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },
  sportsLabel: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted },
  courtCountLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightFaint },
  inactiveWarning: {
    fontFamily: font.sans,
    fontSize: 12,
    color: color.warning,
    backgroundColor: color.warningBg,
    padding: spacing.sm,
    borderRadius: 8,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnLight },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontFamily: font.sansBold, fontSize: 18, color: color.gold, lineHeight: 20 },

  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },

  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 140, height: 100, borderRadius: radius.md, backgroundColor: color.border },
  photoRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(10, 14, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#ffffff', fontSize: 12, fontFamily: font.sansBold, lineHeight: 14 },

  courtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  courtName: { fontFamily: font.serifSemiBold, fontSize: 15, color: color.textOnLight },
  courtMeta: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  courtEditButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  courtEditText: { fontFamily: font.sansSemiBold, fontSize: 12, color: color.gold },

  errorBox: { paddingVertical: spacing.md, alignItems: 'center' },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});