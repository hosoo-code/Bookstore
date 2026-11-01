import Link from "next/link";
import { Atom, BookOpenText, GraduationCap, Heart, Laptop, Layers3, Sparkles, WandSparkles } from "lucide-react";
import { categoryList } from "@/lib/category-list";
const icons = [BookOpenText, GraduationCap, Sparkles, Laptop, Heart, WandSparkles, Atom, Layers3];
export function CategoryBar({ active, items = categoryList }: { active?: string; items?: { slug: string; name: string }[] }) {
  return <div className="site-container category-section"><nav className="category-bar" aria-label="Book categories">
    {items.map((category) => { const index = categoryList.findIndex((item) => item.slug === category.slug); const Icon = icons[index] || Layers3; return <Link className={`category-item ${active === category.slug ? "active" : ""}`} key={category.slug} href={`/categories/${category.slug}`}><Icon size={25} /><span>{category.name}</span></Link>; })}
  </nav></div>;
}
