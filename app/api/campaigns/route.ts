import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CAMPAIGNS_DB_PATH = path.join(process.cwd(), "campaigns.json");
const PUBLIC_KATEGORILER_PATH = path.join(
  process.cwd(),
  "public",
  "kategoriler.json"
);

function getCampaigns() {
  try {
    if (!fs.existsSync(CAMPAIGNS_DB_PATH)) {
      fs.writeFileSync(CAMPAIGNS_DB_PATH, "[]", "utf-8");
      return [];
    }
    const raw = fs.readFileSync(CAMPAIGNS_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveCampaigns(data: any[]) {
  fs.writeFileSync(CAMPAIGNS_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function syncPublicKategoriler(campaigns: any[]) {
  try {
    // Normalize records to a unified node model
    type Node = {
      id: string;
      topParent: string;
      parentId: string | null;
      type: "folder" | "category";
      name: string;
      leadFormId?: string;
    };

    const nodes: Node[] = campaigns
      .map((c: any) => {
        const id = (c.id ?? "").toString();
        const topParent = (c.topParent || c.parent || "Diğer").toString();
        const name = (c.name || c.title || "").toString();
        if (!id || !name) return null;

        const type: "folder" | "category" =
          c.type === "folder" || c.type === "category" ? c.type : "category";

        const parentIdRaw = c.parentId;
        const parentId =
          typeof parentIdRaw === "string" && parentIdRaw.trim() !== ""
            ? parentIdRaw
            : null;

        const leadFormId =
          typeof c.leadFormId === "string" && c.leadFormId.trim() !== ""
            ? c.leadFormId
            : undefined;

        return {
          id,
          topParent,
          parentId,
          type,
          name,
          leadFormId,
        } as Node;
      })
      .filter((n): n is Node => n !== null);

    // Build tree per topParent
    const result: Record<string, any[]> = {};

    const byId: Record<string, any> = {};
    const rootsByTopParent: Record<string, any[]> = {};

    nodes.forEach((n) => {
      const nodeObj: any = {
        id: n.id,
        type: n.type,
        name: n.name,
        children: [] as any[],
      };
      if (n.leadFormId) {
        nodeObj.leadFormId = n.leadFormId;
      }
      byId[n.id] = { ...nodeObj, topParent: n.topParent, parentId: n.parentId };
    });

    Object.values(byId).forEach((node: any) => {
      const topParent = node.topParent || "Diğer";
      if (!rootsByTopParent[topParent]) rootsByTopParent[topParent] = [];

      if (node.parentId && byId[node.parentId]) {
        // Attach to parent
        byId[node.parentId].children.push(node);
      } else {
        // No valid parent: root under topParent
        rootsByTopParent[topParent].push(node);
      }
    });

    // Clean helper fields and sort by name
    Object.keys(rootsByTopParent).forEach((topParent) => {
      const cleanNode = (node: any): any => {
        const children = (node.children || []).map(cleanNode);
        children.sort((a: any, b: any) => a.name.localeCompare(b.name));
        const base: any = {
          id: node.id,
          type: node.type,
          name: node.name,
          children,
        };
        if (node.leadFormId) {
          base.leadFormId = node.leadFormId;
        }
        return base;
      };

      const sortedRoots = rootsByTopParent[topParent]
        .map(cleanNode)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      result[topParent] = sortedRoots;
    });

    fs.writeFileSync(
      PUBLIC_KATEGORILER_PATH,
      JSON.stringify(result, null, 2),
      "utf-8"
    );
  } catch (e) {
    console.error("kategoriler.json senkronize edilirken hata", e);
  }
}

export async function GET() {
  try {
    const items = getCampaigns();
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: "Kampanyalar okunamadı" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = getCampaigns();
    const id = body.id || Date.now().toString();
    const now = new Date().toISOString();
    const rec = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "running",
      ...body,
    };
    items.push(rec);
    saveCampaigns(items);
    syncPublicKategoriler(items);
    return NextResponse.json(rec);
  } catch (e) {
    return NextResponse.json({ error: "Kampanya kaydedilemedi" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const items = getCampaigns();
    const index = items.findIndex((c: any) => c.id == body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
    }
    items[index] = { ...items[index], ...body, updatedAt: new Date().toISOString() };
    saveCampaigns(items);
    syncPublicKategoriler(items);
    return NextResponse.json(items[index]);
  } catch (e) {
    return NextResponse.json({ error: "Kampanya güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }
    let items = getCampaigns();
    items = items.filter((c: any) => String(c.id) !== String(id));
    saveCampaigns(items);
    syncPublicKategoriler(items);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Kampanya silinemedi" }, { status: 500 });
  }
}
