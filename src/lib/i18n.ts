export const locales = ["en", "de", "mn"] as const;
export type Locale = (typeof locales)[number];
export const localeLabels: Record<Locale, string> = { en: "English", de: "Deutsch", mn: "Монгол" };
export const LOCALE_COOKIE = "lang";
export function toLocale(value: string | undefined | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}

const en = {
  "nav.home": "Home", "nav.books": "Books", "nav.categories": "Categories", "nav.feed": "Feed", "nav.about": "About", "nav.contact": "Contact",
  "nav.allBooks": "All Books", "nav.featured": "Featured Books", "nav.english": "English Books", "nav.german": "German Books",
  "nav.messages": "Messages", "nav.notifications": "Notifications", "nav.settings": "Settings", "nav.createAccount": "Create an Account",
  "nav.search": "Search", "nav.profile": "Your profile", "nav.login": "Log in", "nav.quick": "Quick navigation", "nav.language": "Language",
  "search.placeholder": "Search books...",
  "hero.eyebrow": "Welcome to your next chapter", "hero.subtitle": "Two languages. One world of books.",
  "hero.desc": "Discover a vast collection of books in English and German, and find your next favorite read.", "hero.button": "Explore Books",
  "home.featured": "Featured Books", "home.english": "English Books", "home.german": "German Books", "home.viewAll": "View all", "home.viewAllBooks": "View all books",
  "home.corner": "The reading corner", "home.fromReaders": "From Our Readers", "home.exploreFeed": "Explore the Feed", "home.join": "Join the conversation",
  "home.emptyTitle": "A community for every chapter.", "home.emptyDesc": "Share what you’re reading, swap recommendations, and meet people who love the same stories as you.", "home.exploreReader": "Explore Reader Feed",
  "book.add": "Add to Cart", "book.out": "Out of Stock",
  "promo.line1": "READ MORE.", "promo.line2": "LIVE BETTER.", "promo.copy": "Join BookBuch and get exclusive deals on your favorite books.", "promo.button": "Join Now",
  "footer.quick": "Quick Links", "footer.privacy": "Privacy Policy", "footer.terms": "Terms of Service", "footer.faq": "FAQ", "footer.feed": "Reader Feed", "footer.follow": "Follow Us",
  "footer.tag1": "Two languages. One world of books.", "footer.tag2": "Your next chapter starts here.", "footer.social1": "Stories are better when shared.", "footer.social2": "Find us wherever readers gather.", "footer.rights": "© 2025 BookBuch. All rights reserved.",
  "books.eyebrow": "The collection", "books.title": "Find your next great read.", "books.desc": "Explore stories, ideas, and new perspectives in English and German. There’s something here for every kind of reader.",
  "books.searchPh": "Search by title or author...", "books.allGenres": "All genres", "books.bothLang": "Both languages", "books.recommended": "Recommended",
  "books.priceLow": "Price: Low to High", "books.priceHigh": "Price: High to Low", "books.topRated": "Top Rated", "books.apply": "Apply",
  "books.showing": "Showing", "books.book": "book", "books.books": "books", "books.for": "for", "books.none": "No books found", "books.tryAnother": "Try another title, author, or category.", "books.clear": "Clear filters",
  "cat.fiction": "Fiction", "cat.education": "Education", "cat.self-help": "Self-Help", "cat.technology": "Technology", "cat.romance": "Romance", "cat.fantasy": "Fantasy", "cat.science": "Science", "cat.others": "Others",
} as const;
export type Key = keyof typeof en;

const de: Record<Key, string> = {
  "nav.home": "Startseite", "nav.books": "Bücher", "nav.categories": "Kategorien", "nav.feed": "Feed", "nav.about": "Über uns", "nav.contact": "Kontakt",
  "nav.allBooks": "Alle Bücher", "nav.featured": "Empfohlene Bücher", "nav.english": "Englische Bücher", "nav.german": "Deutsche Bücher",
  "nav.messages": "Nachrichten", "nav.notifications": "Benachrichtigungen", "nav.settings": "Einstellungen", "nav.createAccount": "Konto erstellen",
  "nav.search": "Suchen", "nav.profile": "Dein Profil", "nav.login": "Anmelden", "nav.quick": "Schnellnavigation", "nav.language": "Sprache",
  "search.placeholder": "Bücher suchen...",
  "hero.eyebrow": "Willkommen zu deinem nächsten Kapitel", "hero.subtitle": "Zwei Sprachen. Eine Welt voller Bücher.",
  "hero.desc": "Entdecke eine große Auswahl an englischen und deutschen Büchern und finde dein nächstes Lieblingsbuch.", "hero.button": "Bücher entdecken",
  "home.featured": "Empfohlene Bücher", "home.english": "Englische Bücher", "home.german": "Deutsche Bücher", "home.viewAll": "Alle ansehen", "home.viewAllBooks": "Alle Bücher ansehen",
  "home.corner": "Die Leseecke", "home.fromReaders": "Von unseren Lesern", "home.exploreFeed": "Feed entdecken", "home.join": "Diskussion beitreten",
  "home.emptyTitle": "Eine Gemeinschaft für jedes Kapitel.", "home.emptyDesc": "Teile, was du liest, tausche Empfehlungen aus und lerne Menschen kennen, die dieselben Geschichten lieben.", "home.exploreReader": "Leser-Feed entdecken",
  "book.add": "In den Warenkorb", "book.out": "Nicht auf Lager",
  "promo.line1": "MEHR LESEN.", "promo.line2": "BESSER LEBEN.", "promo.copy": "Werde Teil von BookBuch und sichere dir exklusive Angebote für deine Lieblingsbücher.", "promo.button": "Jetzt beitreten",
  "footer.quick": "Schnellzugriff", "footer.privacy": "Datenschutz", "footer.terms": "Nutzungsbedingungen", "footer.faq": "FAQ", "footer.feed": "Leser-Feed", "footer.follow": "Folge uns",
  "footer.tag1": "Zwei Sprachen. Eine Welt voller Bücher.", "footer.tag2": "Dein nächstes Kapitel beginnt hier.", "footer.social1": "Geschichten sind schöner, wenn man sie teilt.", "footer.social2": "Du findest uns überall, wo Leser sich treffen.", "footer.rights": "© 2025 BookBuch. Alle Rechte vorbehalten.",
  "books.eyebrow": "Die Sammlung", "books.title": "Finde dein nächstes großartiges Buch.", "books.desc": "Entdecke Geschichten, Ideen und neue Perspektiven auf Englisch und Deutsch. Für jeden Lesertyp ist etwas dabei.",
  "books.searchPh": "Nach Titel oder Autor suchen...", "books.allGenres": "Alle Genres", "books.bothLang": "Beide Sprachen", "books.recommended": "Empfohlen",
  "books.priceLow": "Preis: aufsteigend", "books.priceHigh": "Preis: absteigend", "books.topRated": "Am besten bewertet", "books.apply": "Anwenden",
  "books.showing": "Angezeigt:", "books.book": "Buch", "books.books": "Bücher", "books.for": "für", "books.none": "Keine Bücher gefunden", "books.tryAnother": "Versuche einen anderen Titel, Autor oder eine andere Kategorie.", "books.clear": "Filter zurücksetzen",
  "cat.fiction": "Belletristik", "cat.education": "Bildung", "cat.self-help": "Ratgeber", "cat.technology": "Technik", "cat.romance": "Romantik", "cat.fantasy": "Fantasy", "cat.science": "Wissenschaft", "cat.others": "Sonstiges",
};

const mn: Record<Key, string> = {
  "nav.home": "Нүүр", "nav.books": "Номууд", "nav.categories": "Ангилал", "nav.feed": "Мэдээлэл", "nav.about": "Бидний тухай", "nav.contact": "Холбоо барих",
  "nav.allBooks": "Бүх ном", "nav.featured": "Онцлох ном", "nav.english": "Англи ном", "nav.german": "Герман ном",
  "nav.messages": "Мессеж", "nav.notifications": "Мэдэгдэл", "nav.settings": "Тохиргоо", "nav.createAccount": "Бүртгэл үүсгэх",
  "nav.search": "Хайх", "nav.profile": "Миний профайл", "nav.login": "Нэвтрэх", "nav.quick": "Түргэн цэс", "nav.language": "Хэл",
  "search.placeholder": "Ном хайх...",
  "hero.eyebrow": "Дараагийн бүлэгтээ тавтай морил", "hero.subtitle": "Хоёр хэл. Номын нэг ертөнц.",
  "hero.desc": "Англи, герман хэл дээрх номын асар их цуглуулгыг нээж, дараагийн дуртай номоо олоорой.", "hero.button": "Ном үзэх",
  "home.featured": "Онцлох ном", "home.english": "Англи ном", "home.german": "Герман ном", "home.viewAll": "Бүгдийг үзэх", "home.viewAllBooks": "Бүх номыг үзэх",
  "home.corner": "Уншлагын булан", "home.fromReaders": "Уншигчдаас", "home.exploreFeed": "Мэдээлэл үзэх", "home.join": "Ярианд нэгдэх",
  "home.emptyTitle": "Бүлэг бүрт зориулсан нийгэмлэг.", "home.emptyDesc": "Юу уншиж байгаагаа хуваалцаж, санал солилцож, ижил түүх хайрладаг хүмүүстэй танилцаарай.", "home.exploreReader": "Уншигчдын мэдээлэл үзэх",
  "book.add": "Сагсанд нэмэх", "book.out": "Дууссан",
  "promo.line1": "ИХ УНШ.", "promo.line2": "ЦЭНЭГЛЭЭР АМЬД.", "promo.copy": "BookBuch-д нэгдэж, дуртай номууддаа онцгой хямдрал аваарай.", "promo.button": "Нэгдэх",
  "footer.quick": "Түргэн холбоос", "footer.privacy": "Нууцлалын бодлого", "footer.terms": "Үйлчилгээний нөхцөл", "footer.faq": "Түгээмэл асуулт", "footer.feed": "Уншигчдын мэдээлэл", "footer.follow": "Биднийг дага",
  "footer.tag1": "Хоёр хэл. Номын нэг ертөнц.", "footer.tag2": "Таны дараагийн бүлэг эндээс эхэлнэ.", "footer.social1": "Түүх хуваалцах тусам гоё.", "footer.social2": "Уншигчид цуглардаг газар бүрээс биднийг олоорой.", "footer.rights": "© 2025 BookBuch. Бүх эрх хуулиар хамгаалагдсан.",
  "books.eyebrow": "Цуглуулга", "books.title": "Дараагийн гайхалтай номоо ол.", "books.desc": "Англи, герман хэл дээрх түүх, санаа, шинэ өнцгийг судлаарай. Уншигч бүрт тохирох ном энд бий.",
  "books.searchPh": "Нэр эсвэл зохиолчоор хайх...", "books.allGenres": "Бүх төрөл", "books.bothLang": "Хоёр хэл", "books.recommended": "Санал болгох",
  "books.priceLow": "Үнэ: багаас их", "books.priceHigh": "Үнэ: ихээс бага", "books.topRated": "Өндөр үнэлгээтэй", "books.apply": "Хэрэглэх",
  "books.showing": "Харуулж байна:", "books.book": "ном", "books.books": "ном", "books.for": "—", "books.none": "Ном олдсонгүй", "books.tryAnother": "Өөр нэр, зохиолч эсвэл ангилал оролдоорой.", "books.clear": "Шүүлтүүр цэвэрлэх",
  "cat.fiction": "Уран зохиол", "cat.education": "Боловсрол", "cat.self-help": "Хөгжил", "cat.technology": "Технологи", "cat.romance": "Романтик", "cat.fantasy": "Фэнтэзи", "cat.science": "Шинжлэх ухаан", "cat.others": "Бусад",
};

const dictionaries: Record<Locale, Record<Key, string>> = { en, de, mn };
export function translator(locale: Locale) {
  const dict = dictionaries[locale];
  return (key: Key) => dict[key];
}
export type Translator = ReturnType<typeof translator>;
export function categoryName(t: Translator, slug: string, fallback: string) {
  const key = `cat.${slug}` as Key;
  return key in en ? t(key) : fallback;
}
