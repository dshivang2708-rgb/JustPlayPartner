export type Venue = {
  id: string;
  name: string;
  address: string;
  sportsLabel: string;
  courtCount: number;
  status: 'active' | 'inactive';
};

export const venues: Venue[] = [
  { id: 'v1', name: 'Sunrise Sports Arena', address: 'Sector 17, Chandigarh', sportsLabel: 'Football, Badminton, Cricket', courtCount: 5, status: 'active' },
  { id: 'v2', name: 'Sunrise Sports Arena — Annex', address: 'Sector 22, Chandigarh', sportsLabel: 'Badminton, Table Tennis', courtCount: 3, status: 'active' },
  { id: 'v3', name: 'Riverside Turf Club', address: 'Zirakpur, Punjab', sportsLabel: 'Football', courtCount: 2, status: 'inactive' },
];

export type EventStatus = 'upcoming' | 'past' | 'pending';

export type VenueEvent = {
  id: string;
  title: string;
  venueName: string;
  dateLabel: string;
  status: EventStatus;
  participantsLabel: string;
};

export const events: VenueEvent[] = [
  { id: 'ev1', title: 'Sunrise 5-a-side Football League', venueName: 'Sunrise Sports Arena', dateLabel: '02 Aug 2026', status: 'upcoming', participantsLabel: '8 teams registered' },
  { id: 'ev2', title: 'Badminton Doubles Night', venueName: 'Sunrise Sports Arena — Annex', dateLabel: '28 Jul 2026', status: 'upcoming', participantsLabel: '12 players registered' },
  { id: 'ev3', title: 'Monsoon Cricket Cup — approval pending', venueName: 'Sunrise Sports Arena', dateLabel: '15 Aug 2026', status: 'pending', participantsLabel: 'Awaiting venue slot confirmation' },
  { id: 'ev4', title: 'Summer Football Championship', venueName: 'Riverside Turf Club', dateLabel: '10 Jun 2026', status: 'past', participantsLabel: '16 teams participated' },
  { id: 'ev5', title: 'Table Tennis Open', venueName: 'Sunrise Sports Arena — Annex', dateLabel: '02 Jun 2026', status: 'past', participantsLabel: '24 players participated' },
];