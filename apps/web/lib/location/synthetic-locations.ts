import type { LocationSearchResult } from '@civic-reporting/contracts';

export const syntheticLocations: readonly LocationSearchResult[] = [
  {
    id: 'fixture-lane-77',
    label: 'Fixture Lane 77 (Synthetic)',
    privateAddress: 'Private Fixture Lane 77',
    publicLabel: 'Harborfield North (Synthetic)',
    exactLocation: { longitude: 0.0042, latitude: 0.0031 },
    publicLocation: { longitude: 0, latitude: 0 },
    publicLocationPrecision: 'neighborhood',
    source: 'synthetic_fixture',
  },
  {
    id: 'lamp-post-12',
    label: 'Lamp Post 12, Sample Avenue (Synthetic)',
    privateAddress: 'Lamp Post 12, Sample Avenue',
    publicLabel: 'Harborfield Central Block (Synthetic)',
    exactLocation: { longitude: 0.0018, latitude: -0.0022 },
    publicLocation: { longitude: 0.002, latitude: -0.002 },
    publicLocationPrecision: 'block',
    source: 'synthetic_fixture',
  },
  {
    id: 'demo-square-east',
    label: 'Demo Square East (Synthetic)',
    privateAddress: 'East edge of Demo Square',
    publicLabel: 'Harborfield East (Synthetic)',
    exactLocation: { longitude: 0.0084, latitude: 0.0062 },
    publicLocation: { longitude: 0.01, latitude: 0.01 },
    publicLocationPrecision: 'neighborhood',
    source: 'synthetic_fixture',
  },
];

export function searchSyntheticLocations(query: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];
  return syntheticLocations.filter((location) =>
    `${location.label} ${location.publicLabel}`
      .toLowerCase()
      .includes(normalized),
  );
}

export function nearestSyntheticLocation(
  longitude: number,
  latitude: number,
): LocationSearchResult | null {
  if (
    longitude < -0.05 ||
    longitude > 0.05 ||
    latitude < -0.05 ||
    latitude > 0.05
  ) {
    return null;
  }
  return [...syntheticLocations].sort((left, right) => {
    const leftDistance =
      (left.exactLocation.longitude - longitude) ** 2 +
      (left.exactLocation.latitude - latitude) ** 2;
    const rightDistance =
      (right.exactLocation.longitude - longitude) ** 2 +
      (right.exactLocation.latitude - latitude) ** 2;
    return leftDistance - rightDistance;
  })[0]!;
}

export function localLocationProviderEnabled() {
  try {
    return (
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname ===
      '127.0.0.1'
    );
  } catch {
    return false;
  }
}
