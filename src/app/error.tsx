"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="site-container page-section text-center"><h1 className="page-title">Something went wrong</h1><p className="page-description mx-auto mb-6">We couldn’t load this page. Please try again in a moment.</p><button className="btn-primary" onClick={reset}>Try again</button></div>;
}
