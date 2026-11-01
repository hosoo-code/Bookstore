import Link from "next/link";
import { BookOpen } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className="brand" aria-label="BookBuch home" style={light ? { color: "#fff" } : undefined}>
    <span className="brand-mark" style={light ? { color: "#D8B46C" } : undefined}><BookOpen size={31} strokeWidth={1.75} /></span>
    <span className="brand-name">BookBuch</span>
  </Link>;
}
