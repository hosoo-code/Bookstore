export default function Loading() {
  return <div className="site-container page-section" role="status" aria-label="Loading"><div className="h-9 w-60 animate-pulse rounded bg-[#e8e1d5]" /><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-xl bg-[#e8e1d5]" />)}</div></div>;
}
