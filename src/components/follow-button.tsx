"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
export function FollowButton({ targetId, initial, compact = false }: { targetId: string; initial: boolean; compact?: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/follows", { method: following ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId }) });
      if (response.status === 401) { router.push("/login?next=/feed"); return; }
      if (!response.ok) { alert((await response.json()).error || "Could not update follow."); return; }
      setFollowing(!following); router.refresh();
    } finally { setBusy(false); }
  }
  return <button type="button" disabled={busy} onClick={toggle} className={following ? "btn-outline" : "btn-primary"} style={compact ? { padding: "7px 11px", fontSize: 11 } : undefined}>{following ? <UserCheck size={compact ? 13 : 15} /> : <UserPlus size={compact ? 13 : 15} />}{following ? "Following" : "Follow"}</button>;
}
