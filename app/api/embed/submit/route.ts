import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");
const CAMPAIGNS_PATH = path.join(process.cwd(), "campaigns.json");
const AUTOMATION_CATEGORIES_PATH = path.join(process.cwd(), "data", "categories.json");

function getCustomers() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, "[]", "utf-8");
      return [];
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch (e) {
    return [];
  }
}

function saveCustomers(data: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function findCategoryByFormId(formId: string) {
  // Önce otomasyon kategorilerinde ara
  try {
    if (fs.existsSync(AUTOMATION_CATEGORIES_PATH)) {
      const categories = JSON.parse(fs.readFileSync(AUTOMATION_CATEGORIES_PATH, "utf-8"));
      const match = categories.find((c: any) => 
        c && c.leadFormId && c.leadFormId === formId
      );
      if (match) return match;
    }
  } catch (e) {
    console.error("Otomasyon kategorileri okunamadı", e);
  }

  // Sonra campaigns'de ara
  try {
    if (fs.existsSync(CAMPAIGNS_PATH)) {
      const campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_PATH, "utf-8"));
      const match = campaigns.find((c: any) => 
        c && c.leadFormId && c.leadFormId === formId
      );
      if (match) return match;
    }
  } catch (e) {
    console.error("Campaigns okunamadı", e);
  }

  return null;
}

// CORS headers for embed
function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { name, email, phone, service, message, formId, source } = body;

    if (!name || !phone) {
      return withCors(
        NextResponse.json(
          { error: "Ad ve telefon numarası zorunludur" },
          { status: 400 }
        )
      );
    }

    const customers = getCustomers();

    // Mükerrer kontrolü
    const incomingPhone = (phone || "").replace(/\D/g, "");
    const incomingEmail = (email || "").trim().toLowerCase();

    if (incomingPhone.length >= 6 || incomingEmail) {
      const duplicate = customers.find((c: any) => {
        const existingPhone = (c.phone || c.personal?.phone || "").replace(/\D/g, "");
        const existingEmail = (c.email || c.personal?.email || "").trim().toLowerCase();

        if (incomingEmail && existingEmail && incomingEmail === existingEmail) {
          return true;
        }
        if (incomingPhone.length >= 6 && existingPhone.length >= 6) {
          const incomingLast9 = incomingPhone.slice(-9);
          const existingLast9 = existingPhone.slice(-9);
          if (incomingLast9 === existingLast9) {
            return true;
          }
        }
        return false;
      });

      if (duplicate) {
        console.log("[Embed] Mükerrer müşteri:", name, phone);
        return withCors(
          NextResponse.json(
            { error: "duplicate", message: "Bu bilgilerle kayıt zaten mevcut" },
            { status: 409 }
          )
        );
      }
    }

    // Kategori eşleşmesi
    const matchedCategory = formId ? findCategoryByFormId(formId) : null;
    const categoryName = matchedCategory?.name || matchedCategory?.title || "Website Form";

    // Yeni müşteri oluştur
    const newCustomer = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      name,
      email: email || "",
      phone,
      personal: {
        name,
        email: email || "",
        phone,
        facebook: {
          leadFormId: formId || "website-embed",
        },
      },
      source: source || "website-embed",
      category: categoryName,
      parentCategory: matchedCategory?.topParent || "Website",
      service: service || "",
      notes: message || "",
      status: {
        status: "Yeni Form",
        category: categoryName,
        services: service || "",
        consultant: "",
      },
      noAutoWelcome: false,
    };

    // CRM API'sine yönlendir (danışman ataması için)
    try {
      const crmResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/crm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newCustomer,
            personal: {
              ...newCustomer.personal,
              facebook: {
                leadFormId: formId || "website-embed",
              },
            },
          }),
        }
      );

      if (crmResponse.ok) {
        const created = await crmResponse.json();
        console.log("[Embed] Müşteri oluşturuldu:", created.id, name);
        return withCors(
          NextResponse.json({ success: true, id: created.id }, { status: 201 })
        );
      } else {
        const errorData = await crmResponse.json();
        // Mükerrer ise yine başarılı say (kullanıcıya teşekkür göster)
        if (errorData.error === "duplicate") {
          return withCors(
            NextResponse.json({ success: true, duplicate: true }, { status: 200 })
          );
        }
        throw new Error(errorData.error || "CRM hatası");
      }
    } catch (crmError) {
      console.error("[Embed] CRM API hatası, doğrudan kayıt:", crmError);
      // CRM API başarısız olursa doğrudan kaydet
      customers.push(newCustomer);
      saveCustomers(customers);
      return withCors(
        NextResponse.json({ success: true, id: newCustomer.id }, { status: 201 })
      );
    }
  } catch (e) {
    console.error("[Embed] Form gönderim hatası:", e);
    return withCors(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    );
  }
}
