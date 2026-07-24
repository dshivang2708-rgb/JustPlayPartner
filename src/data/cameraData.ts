export type CameraStatus = 'live' | 'offline';

export type CourtSnapshot = {
  courtId: string;
  courtName: string;
  status: CameraStatus;
  lastUpdatedLabel: string;
  detectedOccupancy: 'occupied' | 'empty' | 'unclear';
};

export const courtSnapshots: CourtSnapshot[] = [
  { courtId: 'c1', courtName: 'Turf 1', status: 'live', lastUpdatedLabel: 'Just now', detectedOccupancy: 'occupied' },
  { courtId: 'c2', courtName: 'Turf 2', status: 'live', lastUpdatedLabel: '12 sec ago', detectedOccupancy: 'empty' },
  { courtId: 'c3', courtName: 'Court A', status: 'live', lastUpdatedLabel: 'Just now', detectedOccupancy: 'occupied' },
  { courtId: 'c4', courtName: 'Court B', status: 'offline', lastUpdatedLabel: '2 hr ago', detectedOccupancy: 'unclear' },
  { courtId: 'c5', courtName: 'Box Cricket Net', status: 'live', lastUpdatedLabel: '5 sec ago', detectedOccupancy: 'occupied' },
];

// Daily occupancy timeline — hourly detected occupancy % from camera feed, 6 AM to 10 PM
export const dailyOccupancyTimeline = [
  { label: '6a', value: 12 }, { label: '8a', value: 18 }, { label: '10a', value: 22 },
  { label: '12p', value: 35 }, { label: '2p', value: 40 }, { label: '4p', value: 58 },
  { label: '6p', value: 82 }, { label: '8p', value: 94 }, { label: '10p', value: 61 },
];

export type DiscrepancyAlert = {
  id: string;
  courtName: string;
  timeLabel: string;
  description: string;
  severity: 'amber' | 'red';
};

export const discrepancyAlerts: DiscrepancyAlert[] = [
  {
    id: 'da1',
    courtName: 'Court A — Badminton',
    timeLabel: 'Today, 4:00–5:00 PM',
    description: 'Slot shows as booked in the system, but the camera detected no players for the full hour.',
    severity: 'red',
  },
  {
    id: 'da2',
    courtName: 'Turf 1 — Football',
    timeLabel: 'Today, 6:00–7:00 PM',
    description: 'Camera detected players for 45 of 60 minutes — booking may have started late.',
    severity: 'amber',
  },
  {
    id: 'da3',
    courtName: 'Court B — Badminton',
    timeLabel: 'Yesterday, 8:00–9:00 PM',
    description: 'Camera feed was offline during this slot — occupancy could not be verified.',
    severity: 'amber',
  },
];