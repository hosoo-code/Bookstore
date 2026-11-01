import Link from "next/link";
import { BookOpen } from "lucide-react";
export default function NotFound() { return <div className="site-container page-section flex flex-col items-center justify-center text-center"><BookOpen size={45} strokeWidth={1.2} className="text-[#ba9b64]" /><p className="page-eyebrow mt-5">Page not found</p><h1 className="page-title">This chapter is missing.</h1><p className="page-description mx-auto">The page you’re looking for isn’t on our shelves.</p><Link href="/" className="btn-primary mt-6">Return Home</Link></div>; }
