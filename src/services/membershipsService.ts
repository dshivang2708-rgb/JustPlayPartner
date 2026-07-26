import { supabase } from '../lib/supabase';
import { fetchMyVenues } from './venuesService';
import { MembershipPlan, Member, RenewalStatus } from '../data/membershipData';

type RpcPlan = { id: string; name: string; price: number; billing_cycle: string; sport: string; member_count: number };
type RpcMember = {
  id: string;
  plan_id: string;
  plan_name: string;
  customer_name: string;
  customer_phone: string | null;
  renewal_date: string;
  status: RenewalStatus;
};
type RpcRow = { plans: RpcPlan[]; members: RpcMember[]; active_count: number; expiring_count: number; lapsed_count: number };

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export type MembershipsOverview = {
  plans: MembershipPlan[];
  members: Member[];
  activeCount: number;
  expiringCount: number;
  lapsedCount: number;
};

export async function fetchMembershipsOverview(): Promise<MembershipsOverview> {
  const { data, error } = await supabase.rpc('get_partner_memberships');
  if (error) throw new Error(error.message);

  const row = data as unknown as RpcRow;

  const plans: MembershipPlan[] = (row.plans ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    priceLabel: formatRupees(Number(p.price)),
    billingCycle: p.billing_cycle as MembershipPlan['billingCycle'],
    memberCount: Number(p.member_count),
    sport: p.sport,
  }));

  const members: Member[] = (row.members ?? []).map((m) => ({
    id: m.id,
    name: m.customer_name,
    phone: m.customer_phone ?? '—',
    planName: m.plan_name,
    renewalDate: formatDate(m.renewal_date),
    status: m.status,
  }));

  return {
    plans,
    members,
    activeCount: Number(row.active_count ?? 0),
    expiringCount: Number(row.expiring_count ?? 0),
    lapsedCount: Number(row.lapsed_count ?? 0),
  };
}

export async function createMembershipPlan(input: {
  name: string;
  price: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  sport: string;
}) {
  const venues = await fetchMyVenues();
  if (venues.length === 0) throw new Error('Add a venue before creating a membership plan.');

  const { error } = await supabase.from('membership_plans').insert({
    venue_id: venues[0].id,
    name: input.name,
    price: input.price,
    billing_cycle: input.billingCycle,
    sport: input.sport,
  });
  if (error) throw new Error(error.message);
}

const CYCLE_DAYS: Record<string, number> = { Monthly: 30, Quarterly: 90, Yearly: 365 };

export async function addMember(input: {
  planId: string;
  customerName: string;
  customerPhone: string;
  billingCycle: string;
}) {
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + (CYCLE_DAYS[input.billingCycle] ?? 30));

  const { error } = await supabase.from('memberships').insert({
    plan_id: input.planId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    renewal_date: renewalDate.toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

export async function renewMember(membershipId: string, billingCycle: string) {
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + (CYCLE_DAYS[billingCycle] ?? 30));

  const { error } = await supabase
    .from('memberships')
    .update({ renewal_date: renewalDate.toISOString().slice(0, 10) })
    .eq('id', membershipId);
  if (error) throw new Error(error.message);
}