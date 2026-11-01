"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen, Boxes, ClipboardList, Flag, Mail, Plus, Save, Trash2, UploadCloud, Users, X } from "lucide-react";
import type { Book, Category } from "@/db/schema";
import type { CatalogBook } from "@/lib/catalog";
import { formatPrice, timeAgo } from "@/lib/utils";

type Tab = "overview" | "books" | "categories" | "orders" | "users" | "reports" | "inbox";
type AdminOrder = { order: { id: string; status: string; totalCents: number; shippingName: string; shippingAddress: string; shippingPhone: string; paymentMethod: string; createdAt: string }; customer: { username: string; email: string } };
type AdminUser = { id: string; username: string; displayName: string; email: string; role: string; createdAt: string };
type AdminReport = { id: string; reason: string; status: string; targetPostId: string | null; targetUserId: string | null; createdAt: string; postBody?: string | null; targetUsername?: string | null };
type Contact = { id: string; name: string; email: string; message: string; createdAt: string };
type BookForm = { title: string; author: string; description: string; isbn: string; categoryId: string; price: string; stock: string; coverUrl: string; language: string; featured: boolean };
const tabs: { id: Tab; name: string; icon: typeof BookOpen }[] = [
  { id: "overview", name: "Overview", icon: Boxes }, { id: "books", name: "Books", icon: BookOpen }, { id: "categories", name: "Categories", icon: ClipboardList }, { id: "orders", name: "Orders", icon: ClipboardList }, { id: "users", name: "Users", icon: Users }, { id: "reports", name: "Reports", icon: Flag }, { id: "inbox", name: "Inbox", icon: Mail },
];
const emptyBook = (categoryId?: number): BookForm => ({ title: "", author: "", description: "", isbn: "", categoryId: String(categoryId || ""), price: "", stock: "0", coverUrl: "", language: "English", featured: false });
async function mutate(url: string, method: string, body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export function AdminDashboard({ initialBooks, initialCategories, adminId }: { initialBooks: CatalogBook[]; initialCategories: Category[]; adminId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [books, setBooks] = useState<CatalogBook[]>(initialBooks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [inbox, setInbox] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [bookForm, setBookForm] = useState<BookForm>(() => emptyBook(initialCategories[0]?.id));
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    Promise.all(["orders", "users", "reports", "contact"].map(async (name) => {
      const response = await fetch(`/api/admin/${name}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load ${name}.`);
      return response.json();
    })).then(([orderData, userData, reportData, contactData]) => {
      if (active) { setOrders(orderData.orders); setUsers(userData.users); setReports(reportData.reports); setInbox(contactData.messages); }
    }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function notice(text: string) { setError(""); setSuccess(text); window.setTimeout(() => setSuccess(""), 4000); }
  function startEditBook(book: Book) { setTab("books"); setEditingBookId(book.id); setBookForm({ title: book.title, author: book.author, description: book.description, isbn: book.isbn || "", categoryId: String(book.categoryId || ""), price: (book.priceCents / 100).toFixed(2), stock: String(book.stock), coverUrl: book.coverUrl, language: book.language, featured: book.featured }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function uploadCover(file: File) {
    setUploading(true); setError("");
    try { const data = new FormData(); data.append("file", file); data.append("purpose", "book"); const response = await fetch("/api/upload", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setBookForm((current) => ({ ...current, coverUrl: result.url })); notice("Cover uploaded. Save the book to keep it."); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(false); }
  }
  async function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { ...bookForm, categoryId: Number(bookForm.categoryId), price: Number(bookForm.price), stock: Number(bookForm.stock) };
      const data = await mutate(editingBookId ? `/api/books/${editingBookId}` : "/api/books", editingBookId ? "PATCH" : "POST", payload);
      const category = categories.find((item) => item.id === data.book.categoryId);
      const updated: CatalogBook = { ...data.book, category: category?.name || "Others", categorySlug: category?.slug || "others" };
      setBooks((current) => editingBookId ? current.map((item) => item.id === updated.id ? updated : item) : [...current, updated]);
      setBookForm(emptyBook(categories[0]?.id)); setEditingBookId(null); notice(editingBookId ? "Book updated." : "Book added."); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save book."); }
    finally { setBusy(false); }
  }
  async function deleteBook(id: number) {
    if (!window.confirm("Delete this book from the catalog?")) return;
    setBusy(true);
    try { await mutate(`/api/books/${id}`, "DELETE", {}); setBooks((current) => current.filter((item) => item.id !== id)); notice("Book deleted."); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete book."); }
    finally { setBusy(false); }
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { const data = await mutate("/api/admin/categories", editingCategoryId ? "PATCH" : "POST", { ...categoryForm, id: editingCategoryId }); setCategories((current) => editingCategoryId ? current.map((item) => item.id === data.category.id ? data.category : item) : [...current, data.category]); setCategoryForm({ name: "", slug: "" }); setEditingCategoryId(null); notice("Category saved."); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save category."); }
    finally { setBusy(false); }
  }
  async function deleteCategory(id: number) {
    if (!window.confirm("Delete this empty category?")) return;
    try { await mutate("/api/admin/categories", "DELETE", { id }); setCategories((current) => current.filter((item) => item.id !== id)); notice("Category deleted."); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete category."); }
  }
  async function changeOrder(id: string, status: string) {
    try { await mutate("/api/admin/orders", "PATCH", { id, status }); setOrders((current) => current.map((item) => item.order.id === id ? { ...item, order: { ...item.order, status } } : item)); notice("Order updated."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update order."); }
  }
  async function changeRole(id: string, role: string) {
    try { await mutate("/api/admin/users", "PATCH", { id, role }); setUsers((current) => current.map((item) => item.id === id ? { ...item, role } : item)); notice("User updated."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update user."); }
  }
  async function resolveReport(id: string, status: string) {
    try { await mutate("/api/admin/reports", "PATCH", { id, status }); setReports((current) => current.map((item) => item.id === id ? { ...item, status } : item)); notice("Report updated."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update report."); }
  }
  return <div><p className="page-eyebrow">BookBuch management</p><h1 className="page-title">Admin Dashboard</h1><p className="page-description mb-7">Manage your bookstore and keep the reading community safe.</p>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setTab(item.id); setError(""); }} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold ${tab === item.id ? "bg-[#101B30] text-white" : "border border-[#e8e1d6] bg-white text-[#5d6877] hover:bg-[#f7f3eb]"}`}><Icon size={15} />{item.name}</button>; })}</div>
    {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-xs text-red-700">{error}</p>}{success && <p role="status" className="mb-5 rounded-lg bg-[#edf4e9] p-4 text-xs text-[#517455]">{success}</p>}
    {tab === "overview" && <><div className="grid grid-cols-2 gap-4 md:grid-cols-5">{[{ label: "Books", value: books.length, icon: BookOpen, tab: "books" }, { label: "Categories", value: categories.length, icon: Boxes, tab: "categories" }, { label: "Orders", value: orders.length, icon: ClipboardList, tab: "orders" }, { label: "Readers", value: users.length, icon: Users, tab: "users" }, { label: "Open Reports", value: reports.filter((item) => item.status === "open").length, icon: Flag, tab: "reports" }].map((card) => { const Icon = card.icon; return <button key={card.label} type="button" onClick={() => setTab(card.tab as Tab)} className="panel p-5 text-left hover:shadow-md"><Icon size={20} className="text-[#b3945c]" /><span className="mt-4 block text-2xl font-bold text-[#101B30]">{loading ? "…" : card.value}</span><span className="mt-1 block text-xs text-[#888]">{card.label}</span></button>; })}</div><div className="panel mt-6 p-6"><h2 className="serif text-2xl text-[#101B30]">Store at a glance</h2><p className="mt-2 text-sm text-[#777]">Every change here is checked again on the server. Only users with the admin role can access this area.</p><button type="button" onClick={() => { setTab("books"); setEditingBookId(null); setBookForm(emptyBook(categories[0]?.id)); }} className="btn-primary mt-5"><Plus size={15} /> Add a Book</button></div></>}
    {tab === "books" && <div className="space-y-6"><form onSubmit={saveBook} className="panel p-6"><div className="mb-5 flex items-center justify-between"><h2 className="serif text-2xl text-[#101B30]">{editingBookId ? "Edit Book" : "Add a New Book"}</h2>{editingBookId && <button type="button" className="text-xs text-[#888]" onClick={() => { setEditingBookId(null); setBookForm(emptyBook(categories[0]?.id)); }}><X size={17} /></button>}</div><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Title</span><input className="form-input" required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></label><label><span className="field-label">Author</span><input className="form-input" required value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></label><label><span className="field-label">Category</span><select className="form-input" required value={bookForm.categoryId} onChange={(e) => setBookForm({ ...bookForm, categoryId: e.target.value })}><option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="field-label">ISBN (optional)</span><input className="form-input" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} /></label><label><span className="field-label">Price ($)</span><input className="form-input" type="number" min="0" step="0.01" required value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} /></label><label><span className="field-label">Stock</span><input className="form-input" type="number" min="0" step="1" required value={bookForm.stock} onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })} /></label><label><span className="field-label">Language</span><select className="form-input" value={bookForm.language} onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}><option>English</option><option>German</option></select></label><label className="flex items-center gap-2 pt-6 text-xs font-semibold text-[#101B30]"><input type="checkbox" checked={bookForm.featured} onChange={(e) => setBookForm({ ...bookForm, featured: e.target.checked })} className="h-4 w-4 accent-[#101B30]" /> Featured book</label></div><label className="mt-4 block"><span className="field-label">Description</span><textarea className="form-input min-h-24" value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} /></label><div className="mt-4 flex flex-wrap items-center gap-4"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadCover(file); e.target.value = ""; }} /><button type="button" className="btn-outline" disabled={uploading} onClick={() => fileRef.current?.click()}><UploadCloud size={16} />{uploading ? "Uploading..." : "Upload Cover"}</button>{bookForm.coverUrl && <Image src={bookForm.coverUrl} width={38} height={57} alt="New cover preview" className="h-14 w-auto object-contain" unoptimized={bookForm.coverUrl.startsWith("http") || bookForm.coverUrl.startsWith("/uploads/")} />}<span className="max-w-[220px] truncate text-[11px] text-[#888]">{bookForm.coverUrl || "No cover uploaded"}</span></div><button type="submit" className="btn-primary mt-5" disabled={busy || uploading}><Save size={15} />{busy ? "Saving..." : editingBookId ? "Save Changes" : "Add Book"}</button></form>
      <div className="panel overflow-hidden"><div className="border-b border-[#eee8df] p-5"><h2 className="serif text-xl text-[#101B30]">All Books ({books.length})</h2></div><div className="divide-y divide-[#f0ebe4]">{books.map((book) => <div key={book.id} className="flex flex-wrap items-center gap-4 p-4"><div className="flex h-16 w-12 shrink-0 items-center justify-center bg-[#f5f1e9]">{book.coverUrl && <Image src={book.coverUrl} width={37} height={55} alt={book.title} className="max-h-full w-auto" unoptimized={book.coverUrl.startsWith("http") || book.coverUrl.startsWith("/uploads/")} />}</div><div className="min-w-[140px] flex-1"><p className="text-xs font-bold text-[#101B30]">{book.title}</p><p className="mt-1 text-[11px] text-[#888]">{book.author} · {book.category}</p></div><span className="text-xs font-bold text-[#101B30]">{formatPrice(book.priceCents)}</span><span className="w-16 text-xs text-[#888]">{book.stock} left</span><button type="button" className="btn-outline !px-3 !py-2" onClick={() => startEditBook(book)}>Edit</button><button type="button" className="rounded p-2 text-[#9a9a9a] hover:bg-red-50 hover:text-red-600" onClick={() => deleteBook(book.id)} aria-label={`Delete ${book.title}`}><Trash2 size={16} /></button></div>)}</div></div></div>}
    {tab === "categories" && <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]"><form onSubmit={saveCategory} className="panel space-y-4 p-6"><h2 className="serif text-2xl text-[#101B30]">{editingCategoryId ? "Edit Category" : "New Category"}</h2><label className="block"><span className="field-label">Name</span><input className="form-input" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label><label className="block"><span className="field-label">Slug</span><input className="form-input" required pattern="[a-z0-9-]+" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase() })} placeholder="new-category" /></label><div className="flex gap-2"><button type="submit" disabled={busy} className="btn-primary"><Save size={15} /> Save Category</button>{editingCategoryId && <button type="button" className="btn-outline" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: "", slug: "" }); }}>Cancel</button>}</div></form><div className="panel divide-y divide-[#f0ebe4] overflow-hidden">{categories.map((category) => <div key={category.id} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#101B30]">{category.name}</p><p className="mt-1 text-[11px] text-[#888]">/{category.slug} · {books.filter((book) => book.categoryId === category.id).length} books</p></div><button type="button" className="btn-outline !px-3 !py-2" onClick={() => { setEditingCategoryId(category.id); setCategoryForm({ name: category.name, slug: category.slug }); }}>Edit</button><button type="button" onClick={() => deleteCategory(category.id)} className="p-2 text-[#999] hover:text-red-600" aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button></div>)}</div></div>}
    {tab === "orders" && <div className="space-y-3">{loading && <p className="text-sm text-[#888]">Loading orders...</p>}{orders.length ? orders.map(({ order, customer }) => <div key={order.id} className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-[#101B30]">Order #{order.id.slice(0, 8).toUpperCase()}</h3><p className="mt-1 text-xs text-[#888]">@{customer.username} · {customer.email} · {timeAgo(order.createdAt)}</p><p className="mt-2 text-xs text-[#68717d]">{order.shippingName} · {order.shippingPhone}</p><p className="mt-1 text-xs text-[#68717d]">{order.shippingAddress}</p><p className="mt-1 text-[11px] text-[#9a9a9a]">Cash on delivery · No online charge</p></div><div className="text-right"><p className="mb-2 text-lg font-bold text-[#101B30]">{formatPrice(order.totalCents)}</p><select aria-label={`Status for order ${order.id}`} className="form-input !w-auto capitalize" value={order.status} onChange={(e) => changeOrder(order.id, e.target.value)}>{["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div></div></div>) : !loading && <div className="panel p-8 text-center text-sm text-[#888]">No orders yet.</div>}</div>}
    {tab === "users" && <div className="panel divide-y divide-[#eee8df] overflow-hidden">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center gap-3 p-4"><Users size={19} className="text-[#b29153]" /><div className="min-w-[160px] flex-1"><p className="text-xs font-bold text-[#101B30]">{user.displayName} <span className="font-normal text-[#999]">@{user.username}</span></p><p className="mt-1 text-[11px] text-[#888]">{user.email} · Joined {timeAgo(user.createdAt)}</p></div><select className="form-input !w-auto capitalize" value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} disabled={user.id === adminId} aria-label={`Role for ${user.displayName}`}><option value="user">User</option><option value="admin">Admin</option><option value="suspended">Suspended</option></select></div>)}{!loading && !users.length && <p className="p-8 text-center text-sm text-[#888]">No users yet.</p>}</div>}
    {tab === "reports" && <div className="space-y-3">{reports.length ? reports.map((report) => <div key={report.id} className="panel flex flex-wrap items-start gap-4 p-5"><Flag size={18} className="text-[#bb8f57]" /><div className="min-w-[180px] flex-1"><p className="text-xs font-bold text-[#101B30]">{report.reason}</p>{report.postBody && <p className="mt-2 rounded bg-[#f8f5ef] p-2 text-xs text-[#5b6471]">Reported post: {report.postBody}</p>}{report.targetUsername && <p className="mt-1 text-xs text-[#888]">Reported reader: @{report.targetUsername}</p>}<p className="mt-2 text-[11px] text-[#888]">{report.targetPostId ? `Post: ${report.targetPostId.slice(0, 8)}` : `Reader: ${report.targetUserId?.slice(0, 8)}`} · {timeAgo(report.createdAt)}</p>{report.targetPostId && <a href={`/feed?post=${report.targetPostId}`} className="mt-2 inline-block text-xs text-[#a17b38]">View reported post →</a>}</div><span className="soft-pill capitalize">{report.status}</span><div className="flex gap-2"><button type="button" onClick={() => resolveReport(report.id, "resolved")} className="btn-outline !px-3 !py-2">Resolve</button><button type="button" onClick={() => resolveReport(report.id, "dismissed")} className="btn-outline !px-3 !py-2">Dismiss</button></div></div>) : <div className="panel p-8 text-center text-sm text-[#888]">No reports to review.</div>}</div>}
    {tab === "inbox" && <div className="space-y-3">{inbox.length ? inbox.map((item) => <div key={item.id} className="panel p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-[#101B30]">{item.name} <span className="font-normal text-[#888]">· {item.email}</span></p><p className="text-[11px] text-[#999]">{timeAgo(item.createdAt)}</p></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#555f6d]">{item.message}</p></div>) : <div className="panel p-8 text-center text-sm text-[#888]">No contact messages yet.</div>}</div>}
  </div>;
}
