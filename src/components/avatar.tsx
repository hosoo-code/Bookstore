import Image from "next/image";
import { initials } from "@/lib/utils";
export function Avatar({ name, src, size = 42, className = "" }: { name: string; src?: string | null; size?: number; className?: string }) {
  return <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: Math.max(13, size * .35) }} aria-label={name}>
    {src ? <Image src={src} alt={name} width={size} height={size} unoptimized={src.startsWith("http") || src.startsWith("/uploads/")} /> : initials(name)}
  </span>;
}
