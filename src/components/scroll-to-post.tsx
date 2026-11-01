"use client";
import { useEffect } from "react";
export function ScrollToPost({ id }: { id: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => document.getElementById(`post-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
    return () => window.clearTimeout(timer);
  }, [id]);
  return null;
}
