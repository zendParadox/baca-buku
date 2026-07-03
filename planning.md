Oke, ini planning lengkap buat **BookVerse** — Kindle-style reader app.

---

## 📋 PLAN: BookVerse — Digital Book Reader

### **🎯 Vision:**

Website reading experience yang bikin user lupa kalo lagi baca di browser — bukan PDF viewer biasa, tapi **premium reading experience** kayak Kindle/Rocketbook.

---

## 🏗️ Tech Stack

| Layer           | Technology                  | Alasan                                |
| --------------- | --------------------------- | ------------------------------------- |
| **Framework**   | Next.js 15 (App Router)     | SSR, routing, file handling           |
| **Styling**     | Tailwind CSS 4              | Utility-first, responsive             |
| **PDF Reader**  | `pdf.js` (Mozilla)          | Rendering PDF di browser              |
| **EPUB Reader** | `epub.js`                   | Rendering EPUB di browser             |
| **State**       | Zustand                     | Lightweight state management          |
| **Storage**     | IndexedDB (via `idb`)       | Simpan buku lokal di browser          |
| **Font**        | **Literata** (Google Fonts) | Font yang dibuat khusus untuk reading |
| **Icons**       | Lucide React                | Clean, consistent icons               |
| **Animation**   | Framer Motion               | Page turns, transitions               |

---

## 🎨 Design System: "BookVerse"

### **Typography (CRITICAL)**

| Element             | Font              | Size                 | Weight |
| ------------------- | ----------------- | -------------------- | ------ |
| **Body text**       | Literata          | 18-24px (adjustable) | 400    |
| **Chapter title**   | Fraunces          | 28-36px              | 700    |
| **UI elements**     | Plus Jakarta Sans | 14px                 | 500    |
| **Settings labels** | Plus Jakarta Sans | 13px                 | 400    |

**Kenapa Literata?**

- Didesain khusus oleh Google + TypeTogether untuk **long-form reading**
- Variable font — bisa adjust weight halus
- Optimized untuk screen reading
- Ada optical size yang bikin text makin nyaman di berbagai ukuran

### **Color Themes (3 modes)**

| Theme     | Background             | Text                  | Accent                |
| --------- | ---------------------- | --------------------- | --------------------- |
| **Light** | `#FAFAF9` (warm white) | `#1C1917` (stone-900) | `#2563EB` (blue)      |
| **Dark**  | `#0C0A09` (stone-950)  | `#D6D3D1` (stone-300) | `#60A5FA` (blue-400)  |
| **Sepia** | `#F5F0E8` (parchment)  | `#44403C` (stone-700) | `#B45309` (amber-700) |

**Kenapa Sepia?**

- Warm tones mengurangi eye strain
- Paper-like feel
- Populer di Kindle/Rocketbook/Kobo

### **Spacing (Reading-optimized)**

| Setting               | Default | Min   | Max   |
| --------------------- | ------- | ----- | ----- |
| **Font size**         | 18px    | 14px  | 28px  |
| **Line height**       | 1.8     | 1.5   | 2.2   |
| **Paragraph spacing** | 1.2em   | 0.8em | 2em   |
| **Page margins**      | 15%     | 5%    | 25%   |
| **Max content width** | 680px   | 400px | 900px |

---

## 📱 Page Structure

### **Route Map:**

```
/                          ← Home (Book Library)
/library                   ← Book Library (grid view)
/book/[id]                 ← Reading View
/book/[id]/settings        ← Reader Settings (sidebar)
/api/upload                ← Upload book file
```

---

## 📚 Feature Breakdown

### **1. Home / Library (`/`)**

```
┌─────────────────────────────────────────┐
│  📚 BookVerse          🔍  ⚙️  🌙      │
├─────────────────────────────────────────┤
│                                         │
│  Selamat Datang, Rafli 👋               │
│  Lanjutkan membaca:                     │
│  ┌──────────┐ ┌──────────┐             │
│  │ 📖 Buku  │ │ 📖 Buku  │  ← Continue │
│  │ Progress │ │ Progress │    Reading  │
│  └──────────┘ └──────────┘             │
│                                         │
│  Perpustakaan Saya (23 buku)    + Upload│
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │ 📕  │ │ 📗  │ │ 📘  │ │ 📙  │     │
│  │Book1│ │Book2│ │Book3│ │Book4│     │
│  │32%  │ │100% │ │0%   │ │67%  │     │
│  └─────┘ └─────┘ └─────┘ └─────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Grid/list view toggle
- Continue reading section (last 3 books)
- Search books by title/author
- Sort: by title, progress, recently read, date added
- Upload button (+ drag & drop zone)
- Book progress indicators

---

### **2. Reading View (`/book/[id]`)**

```
┌─────────────────────────────────────────┐
│  ← Back   Chapter 3: Awal Mula   ⚙️ 🔖 │  ← Minimal header (auto-hide)
├─────────────────────────────────────────┤
```

```
┌─────────────────────────────────────────┐
│  ← Back   Chapter 3: Aw ▉ (2/2)
│                                         │
│     Di suatu pagi yang cerah,           │
│     ketika matahari baru saja            │
│     menembus jendela kamar,             │
│     Budi terbangun dengan senyum        │
│     di wajahnya. Dia tahu hari ini      │
│     akan menjadi hari yang spesial.     │
│                                         │
│     "Selamat ulang tahun, sayang,"      │
│     bisiknya sambil meraih telepon      │
│     genggamnya.                         │
│                                         │
│     Di layar, puluhan pesan ucapan      │
│     sudah menumpuk. Tapi yang           │
│     paling membuat hatinya hangat       │
│     adalah pesan dari ibunya:           │
│                                         │
│     "Selamat ulang tahun, nak.          │
│      Semoga selalu diberi              │
│      kesehatan dan kebahagiaan.         │
│      Ibu selalu sayang kamu."           │
│                                         │
│                                     42% │  ← Progress bar
├─────────────────────────────────────────┤
│  ◀  Prev        42/128 pages     Next ▶ │  ← Navigation bar
└─────────────────────────────────────────┘
```

**Features:**

- **Distraction-free** — minimal header, auto-hide on scroll
- **Typography controls** — adjust font size, line height, font family
- **Page navigation** — prev/next, page number input, chapter selector
- **Progress tracking** — percentage + current page / total
- **Auto-save** — progress tersimpan otomatis ke IndexedDB
- **Keyboard navigation** — Arrow keys, Space, Page Up/Down
- **Touch gestures** — swipe left/right (mobile)

---

### **3. Reader Settings (Sidebar/Modal)**

```
┌──────────────────────────────┐
│  ⚙️ Pengaturan Membaca      │
├──────────────────────────────┤
│                              │
│  Ukuran Font:                │
│  [A-] ████████░░ [A+]       │  ← 18px
│                              │
│  Spasi Baris:                │
│  [1.5] ████████░░ [2.2]     │  ← 1.8
│                              │
│  Lebar Konten:               │
│  [400] ████████░░ [900]     │  ← 680px
│                              │
│  Font:                       │
│  [Literata ▾]                │
│   - Literata (reading)       │
│   - Merriweather            │
│   - Lora                    │
│   - Source Serif 4           │
│                              │
│  Tema:                       │
│  ○ Light  ● Dark  ○ Sepia   │
│                              │
│  ─────────────────────────── │
│                              │
│  🔖 Bookmarks (3)            │
│  📝 Highlights (12)          │
│  📊 Progress: 42%            │
│                              │
└──────────────────────────────┘
```

---

### **4. Upload System**

```
┌─────────────────────────────────────────┐
│                                         │
│         📄 Drop file di sini            │
│                                         │
│         atau                            │
│                                         │
│         [ Pilih File ]                  │
│                                         │
│         Format: PDF, EPUB               │
│         Max: 50MB per file              │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**

- Drag & drop upload
- File picker button
- Progress bar upload
- Auto-detect format (PDF vs EPUB)
- Extract metadata (title, author, cover)
- Store in IndexedDB (private, never leaves browser)

---

## 🗂️ Database Schema (IndexedDB)

```typescript
// Buku
interface Book {
  id: string; // UUID
  title: string; // Judul buku
  author: string; // Penulis
  format: "pdf" | "epub"; // Format file
  cover?: string; // Cover image (base64)
  file: Blob; // File asli
  totalPages: number; // Total halaman
  addedAt: Date; // Kapan ditambah
  lastReadAt?: Date; // Terakhir dibaca
}

// Progress
interface ReadingProgress {
  bookId: string;
  currentPage: number;
  percentage: number;
  lastPosition: string; // EPUB CFI / PDF page+scroll
  updatedAt: Date;
}

// Bookmarks
interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  position: string;
  label?: string;
  createdAt: Date;
}

// Highlights
interface Highlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: string;
  note?: string;
  createdAt: Date;
}
```

---

## 📐 Component Architecture

```
src/
├── app/
│   ├── layout.tsx              ← Root layout + providers
│   ├── page.tsx                ← Home / Library
│   ├── library/page.tsx        ← Full library view
│   ├── book/[id]/page.tsx      ← Reading view
│   └── api/upload/route.ts     ← Upload handler
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx       ← Minimal header
│   │   └── AppFooter.tsx       ← Footer (library only)
│   │
│   ├── library/
│   │   ├── BookCard.tsx        ← Book card (grid)
│   │   ├── BookList.tsx        ← Book row (list)
│   │   ├── ContinueReading.tsx ← Continue section
│   │   ├── UploadZone.tsx      ← Drag & drop upload
│   │   └── LibraryToolbar.tsx  ← Search + sort + view toggle
│   │
│   ├── reader/
│   │   ├── ReaderView.tsx      ← Main reading area
│   │   ├── PdfRenderer.tsx     ← PDF.js wrapper
│   │   ├── EpubRenderer.tsx    ← EPUB.js wrapper
│   │   ├── ReaderHeader.tsx    ← Auto-hide top bar
│   │   ├── ReaderFooter.tsx    ← Progress + navigation
│   │   ├── ReaderSettings.tsx  ← Settings sidebar
│   │   ├── ChapterNav.tsx      ← Chapter list
│   │   ├── BookmarkList.tsx    ← Bookmarks sidebar
│   │   └── SearchInBook.tsx    ← Search within book
│   │
│   └── ui/
│       ├── ThemeToggle.tsx     ← Light/Dark/Sepia
│       ├── Slider.tsx          ← Reusable slider
│       ├── Modal.tsx           ← Modal component
│       └── ProgressBar.tsx     ← Progress indicator
│
├── lib/
│   ├── store.ts                ← Zustand store
│   ├── db.ts                   ← IndexedDB operations
│   ├── pdf-parser.ts           ← PDF.js utilities
│   ├── epub-parser.ts          ← EPUB.js utilities
│   └── book-metadata.ts        ← Extract metadata
│
└── types/
    └── index.ts                ← TypeScript interfaces
```

---

## ⚡ Key Technical Decisions

### **1. Why IndexedDB (not server)?**

- ✅ **Private** — buku tidak pernah leave browser
- ✅ **No server cost** — semua client-side
- ✅ **Offline** — bisa baca tanpa internet
- ✅ **Fast** — langsung load dari local
- ⚠️ **Tradeoff** — data hilang kalau clear browser (bisa di-export/import)

### **2. Why Literata font?**

- ✅ Designed for **long-form reading** (bukan UI)
- ✅ Variable font — smooth weight transitions
- ✅ Optical sizing — makin nyaman di berbagai ukuran
- ✅ Google Fonts — free, fast CDN

### **3. Why 3 themes?**

- ✅ **Light** — default, cocok buat siang
- ✅ **Dark** — cocok buat malam, hemat baterai OLED
- ✅ **Sepia** — warm tone, paling nyaman buat mata

### **4. Page rendering approach?**

| Format   | Approach                  | Library   |
| -------- | ------------------------- | --------- |
| **PDF**  | Canvas rendering per page | `pdf.js`  |
| **EPUB** | Reflowable HTML rendering | `epub.js` |

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Hari 1-2)**

- [ ] Setup Next.js + Tailwind project
- [ ] Install dependencies (pdf.js, epub.js, zustand, idb)
- [ ] Setup IndexedDB schema
- [ ] Theme system (Light/Dark/Sepia)
- [ ] Basic layout components

### **Phase 2: Library (Hari 3-4)**

- [ ] Book upload (drag & drop)
- [ ] Book metadata extraction
- [ ] Book grid/list view
- [ ] Continue reading section
- [ ] Search & sort

### **Phase 3: Reader (Hari 5-7)**

- [ ] PDF renderer (pdf.js integration)
- [ ] EPUB renderer (epub.js integration)
- [ ] Reading settings sidebar
- [ ] Font size/line height/margin controls
- [ ] Page navigation (keyboard + touch)
- [ ] Progress tracking + auto-save

### **Phase 4: Features (Hari 8-9)**

- [ ] Bookmarks
- [ ] Chapter navigation
- [ ] Search within book
- [ ] Reading statistics
      Phase 5: Polish (Hari 10)
- [ ] Responsive testing (mobile/tablet/desktop)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Export/import library

---

⚠️ Challenges & Solutions

PDF rendering lambat
• Solution: Lazy load per page, cache rendered pages

EPUB CSS conflicts
• Solution: Shadow DOM isolation

Large files (50MB+)
• Solution: Stream processing, progress indicator

Mobile touch gestures
• Solution: Custom swipe detection, passive listeners

Font loading
• Solution: Preload Literata, fallback to system fonts

State persistence
• Solution: IndexedDB with auto-sync

---

✅ NEXT STEPS

Lo perlu konfirmasi:

1. Nama app: "BookVerse" atau ada nama lain?
2. Fitur priority: Mau fokus reader dulu atau library juga?
3. Storage: IndexedDB cukup atau mau sync ke cloud?
4. Deploy: Vercel atau local only?

---

Kalau udah oke, gue langsung eksekusi Phase 1! 🚀
