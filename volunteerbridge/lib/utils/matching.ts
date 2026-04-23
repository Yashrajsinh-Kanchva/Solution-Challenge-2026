import { haversineDistanceKm } from "@/lib/utils/distance";
import { NgoRecord, RequestRecord, VolunteerRecord } from "@/lib/types/rtdb";

export function suggestNgoIdsForRequest(request: RequestRecord, ngos: NgoRecord[]): string[] {
  const category = request.aiCategory || request.category;

  const scored = ngos
    .filter((ngo) => ngo.verified)
    .filter((ngo) => ngo.categories.includes(category))
    .map((ngo) => {
      const distance = haversineDistanceKm(
        request.location.lat,
        request.location.lng,
        ngo.location.lat,
        ngo.location.lng
      );

      return {
        ngoId: ngo.ngoId,
        distance,
        inServiceRadius: distance <= ngo.serviceRadius,
        rating: ngo.rating
      };
    })
    .filter((item) => item.inServiceRadius)
    .sort((a, b) => {
      if (a.distance === b.distance) {
        return b.rating - a.rating;
      }
      return a.distance - b.distance;
    });

  return scored.map((item) => item.ngoId);
}

export function findBestVolunteerForRequest(
  request: RequestRecord,
  volunteers: VolunteerRecord[]
): VolunteerRecord | null {
  const requiredSkill = (request.aiCategory || request.category).toLowerCase();

  const scored = volunteers
    .filter((volunteer) => volunteer.availability)
    .filter((volunteer) => volunteer.status !== "offline")
    .filter((volunteer) => volunteer.skills.map((s) => s.toLowerCase()).includes(requiredSkill))
    .map((volunteer) => ({
      volunteer,
      distance: haversineDistanceKm(
        request.location.lat,
        request.location.lng,
        volunteer.location.lat,
        volunteer.location.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance);

  return scored[0]?.volunteer ?? null;
}
