import { NextResponse, type NextRequest } from 'next/server';
import {
  localLocationProviderEnabled,
  searchSyntheticLocations,
} from '@/lib/location/synthetic-locations';

export async function GET(request: NextRequest) {
  if (!localLocationProviderEnabled()) {
    return NextResponse.json(
      {
        code: 'location_provider_unavailable',
        message:
          'Address search is unavailable. Use the structured non-map location list.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const query = request.nextUrl.searchParams.get('q') ?? '';
  return NextResponse.json(
    { results: searchSyntheticLocations(query) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
