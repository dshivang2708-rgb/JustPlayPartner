import { supabase } from '../lib/supabase';

export type SuggestionType = 'pricing' | 'membership_renewal' | 'low_stock' | 'recurring_hold';
export type SuggestionStatus = 'active' | 'applied' | 'dismissed' | 'snoozed';

export type Suggestion = {
  id: string;
  type: SuggestionType;
  title: string;
  detail: string;
  expectedImpactLabel: string;
  whyTrail: string[];
  status: SuggestionStatus;
  /** Only pricing suggestions have a real, mechanical Apply -- see apply_pricing_suggestion() in the migration. */
  hasAutomatedApply: boolean;
};

function mapRow(row: any): Suggestion {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail,
    expectedImpactLabel: row.expected_impact_label,
    whyTrail: row.why_trail ?? [],
    status: row.status,
    hasAutomatedApply: row.type === 'pricing',
  };
}

export async function fetchActiveSuggestions(venueId: string): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .eq('venue_id', venueId)
    .or(`status.eq.active,and(status.eq.snoozed,snoozed_until.lte.${new Date().toISOString()})`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Re-runs the rule engine against current data. Returns how many *new* suggestions were created (existing active/snoozed ones for the same issue aren't duplicated). */
export async function refreshSuggestions(venueId: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_suggestions_for_venue', { target_venue_id: venueId });
  if (error) throw error;
  return data as number;
}

/** For pricing suggestions: actually updates the court's price. For everything else: marks resolved (an honest acknowledgment, not a fabricated automation -- see migration comments). */
export async function applySuggestion(suggestion: Suggestion): Promise<void> {
  if (suggestion.type === 'pricing') {
    const { error } = await supabase.rpc('apply_pricing_suggestion', { target_suggestion_id: suggestion.id });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'applied', resolved_at: new Date().toISOString() })
    .eq('id', suggestion.id);
  if (error) throw error;
}

export async function dismissSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function snoozeSuggestion(id: string, days: number = 5): Promise<void> {
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);
  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'snoozed', snoozed_until: snoozedUntil.toISOString() })
    .eq('id', id);
  if (error) throw error;
}