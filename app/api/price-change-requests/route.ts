import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCustomerById, upsertCustomer } from "../lib/sqlite-customers";

const REQUESTS_FILE = path.join(process.cwd(), "price-change-requests.json");

function getRequests(): any[] {
  try {
    if (!fs.existsSync(REQUESTS_FILE)) {
      fs.writeFileSync(REQUESTS_FILE, "[]", "utf-8");
      return [];
    }
    return JSON.parse(fs.readFileSync(REQUESTS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveRequests(requests: any[]): void {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  const requests = getRequests();
  const status = request.nextUrl.searchParams.get("status");
  if (status) {
    return NextResponse.json(requests.filter((r: any) => r.status === status));
  }
  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requests = getRequests();
    const newRequest = {
      id: Date.now(),
      customerId: body.customerId,
      customerName: body.customerName,
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      currentPrice: body.currentPrice,
      currentCurrency: body.currentCurrency,
      newPrice: body.newPrice,
      newCurrency: body.newCurrency || body.currentCurrency,
      reason: body.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    saveRequests(requests);
    return NextResponse.json(newRequest);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, resolvedBy } = body;
    const requests = getRequests();
    const idx = requests.findIndex((r: any) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    requests[idx].status = action === "approve" ? "approved" : "rejected";
    requests[idx].resolvedAt = new Date().toISOString();
    requests[idx].resolvedBy = resolvedBy;

    if (action === "approve") {
      const customer = getCustomerById(requests[idx].customerId);
      if (customer) {
        const req = requests[idx];
        const priceLog = {
          id: Date.now(),
          action: "price_changed",
          section: "sales",
          field: "Satış Fiyatı",
          oldValue: `${req.currentPrice} ${req.currentCurrency}`,
          newValue: `${req.newPrice} ${req.newCurrency || req.currentCurrency}`,
          date: new Date().toLocaleString("tr-TR"),
          user: resolvedBy || "Sistem",
          details: `Fiyat değişiklik talebi onaylandı. Talep eden: ${req.requesterName}. Sebep: ${req.reason}`,
        };
        customer.sales = {
          ...customer.sales,
          price: req.newPrice,
          priceCurrency: req.newCurrency || customer.sales?.priceCurrency,
        };
        customer.history = [priceLog, ...(Array.isArray(customer.history) ? customer.history : [])];
        customer.updatedAt = new Date().toISOString();
        upsertCustomer(customer);
      }
    }

    saveRequests(requests);
    return NextResponse.json(requests[idx]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
