import { getCurrentUser } from "@/lib/auth";
import { getSuggestedPeople } from "@/lib/social";
export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ people: await getSuggestedPeople(user?.id ?? null, user?.favoriteGenres ?? []) });
}
