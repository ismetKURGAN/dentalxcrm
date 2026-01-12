import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "categories.json");

interface Category {
  id: string;
  name: string;
  topParent: string;
  parentId: string | null;
  leadFormId: string;
  firstContact: boolean;
  global: boolean;
  createdAt: string;
  updatedAt: string;
}

function ensureDataDir() {
  const dir = path.dirname(CATEGORIES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readCategories(): Category[] {
  ensureDataDir();
  if (!fs.existsSync(CATEGORIES_FILE)) {
    // Varsayılan kategoriler - campaigns.json'dan migrate et
    const defaultCategories: Category[] = [];
    
    // campaigns.json'dan kategorileri oku
    const campaignsPath = path.join(process.cwd(), "campaigns.json");
    if (fs.existsSync(campaignsPath)) {
      try {
        const raw = fs.readFileSync(campaignsPath, "utf-8");
        const campaigns = JSON.parse(raw);
        
        campaigns.forEach((c: any) => {
          defaultCategories.push({
            id: c.id || Date.now().toString(),
            name: c.name || c.title || "",
            topParent: c.topParent || c.parent || "Meta",
            parentId: c.parentId || null,
            leadFormId: c.leadFormId || "",
            firstContact: c.firstContact || false,
            global: c.global || false,
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
          });
        });
      } catch (e) {
        console.error("campaigns.json okunamadı:", e);
      }
    }
    
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2), "utf-8");
    return defaultCategories;
  }
  
  const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeCategories(categories: Category[]) {
  ensureDataDir();
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const categories = readCategories();
    // En yeniden eskiye sırala
    categories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Kategoriler okunurken hata:", error);
    return NextResponse.json({ error: "Kategoriler okunamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, topParent, parentId, leadFormId, firstContact, global } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Geçerli bir kategori adı gerekli" }, { status: 400 });
    }

    if (!topParent || typeof topParent !== "string") {
      return NextResponse.json({ error: "Üst kategori grubu gerekli" }, { status: 400 });
    }

    const categories = readCategories();
    
    // Aynı isimde ve aynı topParent altında kategori var mı kontrol et
    if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase() && c.topParent === topParent && c.parentId === parentId)) {
      return NextResponse.json({ error: "Bu kategori zaten mevcut" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newCategory: Category = {
      id: Date.now().toString(),
      name: name.trim(),
      topParent: topParent,
      parentId: parentId || null,
      leadFormId: (leadFormId || "").trim(),
      firstContact: firstContact || false,
      global: global || false,
      createdAt: now,
      updatedAt: now,
    };
    
    categories.push(newCategory);
    writeCategories(categories);

    return NextResponse.json({ success: true, category: newCategory, categories });
  } catch (error) {
    console.error("Kategori eklenirken hata:", error);
    return NextResponse.json({ error: "Kategori eklenemedi" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, topParent, parentId, leadFormId, firstContact, global } = body;

    if (!id) {
      return NextResponse.json({ error: "Geçerli bir kategori ID gerekli" }, { status: 400 });
    }

    const categories = readCategories();
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
    }

    // Kendini parent olarak seçemez
    if (parentId === id) {
      return NextResponse.json({ error: "Kategori kendisinin üst kategorisi olamaz" }, { status: 400 });
    }

    if (name !== undefined) categories[index].name = name.trim();
    if (topParent !== undefined) categories[index].topParent = topParent;
    if (parentId !== undefined) categories[index].parentId = parentId;
    if (leadFormId !== undefined) categories[index].leadFormId = leadFormId.trim();
    if (firstContact !== undefined) categories[index].firstContact = firstContact;
    if (global !== undefined) categories[index].global = global;
    categories[index].updatedAt = new Date().toISOString();

    writeCategories(categories);

    return NextResponse.json({ success: true, category: categories[index], categories });
  } catch (error) {
    console.error("Kategori güncellenirken hata:", error);
    return NextResponse.json({ error: "Kategori güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Geçerli bir kategori ID gerekli" }, { status: 400 });
    }

    const categories = readCategories();
    
    // Alt kategorileri kontrol et
    const hasChildren = categories.some(c => c.parentId === id);
    if (hasChildren) {
      return NextResponse.json({ error: "Bu kategorinin alt kategorileri var. Önce alt kategorileri silin." }, { status: 400 });
    }
    
    const filtered = categories.filter(c => c.id !== id);

    if (filtered.length === categories.length) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
    }

    writeCategories(filtered);

    return NextResponse.json({ success: true, categories: filtered });
  } catch (error) {
    console.error("Kategori silinirken hata:", error);
    return NextResponse.json({ error: "Kategori silinemedi" }, { status: 500 });
  }
}
