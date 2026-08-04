import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

/**
 * Requires `expo-image-picker` -- install with:
 *   npx expo install expo-image-picker
 *
 * Uploads go to the 'venue-images' Storage bucket (see
 * supabase/migrations/004_venue_images_storage.sql). That migration also
 * sets the RLS policies that make these uploads actually succeed -- without
 * it, every upload call below will fail with a permissions error.
 */

const BUCKET = 'venue-images';

/**
 * Opens the photo library, lets the owner pick + crop one image, and
 * returns its local file uri -- or null if they cancelled.
 */
export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access is needed to add photos. Enable it in your device settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

async function uploadToStorage(path: string, localUri: string): Promise<string> {
  // Expo/Hermes supports fetch().arrayBuffer() on local file:// uris, which
  // is the current officially-recommended way to get RN image bytes into
  // Supabase Storage without extra base64 dependencies.
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function removeFromStorage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Extracts the storage object path back out of a public URL, e.g. for deletes. */
function pathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

/**
 * Uploads a new venue cover photo and appends it to venues.cover_image_urls.
 * Read-modify-write on the array -- fine here since a single owner adding
 * photos one at a time from their own device isn't a concurrent-write
 * scenario worth an atomic RPC for.
 */
export async function addVenueCoverImage(venueId: string, localUri: string): Promise<string[]> {
  const path = `${venueId}/cover/${Date.now()}.jpg`;
  const publicUrl = await uploadToStorage(path, localUri);

  const { data: current, error: fetchError } = await supabase
    .from('venues')
    .select('cover_image_urls')
    .eq('id', venueId)
    .single();
  if (fetchError) throw fetchError;

  const nextUrls = [...(current.cover_image_urls ?? []), publicUrl];

  const { error: updateError } = await supabase.from('venues').update({ cover_image_urls: nextUrls }).eq('id', venueId);
  if (updateError) throw updateError;

  return nextUrls;
}

export async function removeVenueCoverImage(venueId: string, urlToRemove: string): Promise<string[]> {
  const { data: current, error: fetchError } = await supabase
    .from('venues')
    .select('cover_image_urls')
    .eq('id', venueId)
    .single();
  if (fetchError) throw fetchError;

  const nextUrls = (current.cover_image_urls ?? []).filter((u: string) => u !== urlToRemove);

  const { error: updateError } = await supabase.from('venues').update({ cover_image_urls: nextUrls }).eq('id', venueId);
  if (updateError) throw updateError;

  const path = pathFromPublicUrl(urlToRemove);
  if (path) await removeFromStorage(path); // best-effort; the DB update above is the source of truth

  return nextUrls;
}

/**
 * Uploads/replaces a court's single photo. Courts only have one image_url
 * column (not an array like venues), so this always overwrites.
 */
export async function setCourtImage(venueId: string, courtId: string, localUri: string): Promise<string> {
  const path = `${venueId}/courts/${courtId}/${Date.now()}.jpg`;
  const publicUrl = await uploadToStorage(path, localUri);

  const { error } = await supabase.from('courts').update({ image_url: publicUrl }).eq('id', courtId);
  if (error) throw error;

  return publicUrl;
}