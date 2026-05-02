import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.NOTIFY_SMTP_HOST;
  const user = process.env.NOTIFY_SMTP_USER;
  const pass = process.env.NOTIFY_SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.NOTIFY_SMTP_PORT || 465),
    secure: String(process.env.NOTIFY_SMTP_SECURE || "true") === "true",
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
  return cachedTransporter;
}

function fmtDate(d?: string | Date): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return typeof d === "string" ? d : "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}.${mm}.${yy}`;
}

function fmtDateTime(d?: string | Date): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return typeof d === "string" ? d : "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yy} / ${hh}:${mi}`;
}

async function send(subject: string, html: string, text: string): Promise<void> {
  try {
    const t = getTransporter();
    if (!t) {
      console.warn("[notify-mail] SMTP not configured, skipping:", subject);
      return;
    }
    const to = process.env.NOTIFY_MAIL_TO || process.env.NOTIFY_SMTP_USER;
    const from = process.env.NOTIFY_MAIL_FROM || process.env.NOTIFY_SMTP_USER;
    await t.sendMail({ from, to, subject, html, text });
    console.log("[notify-mail] sent:", subject);
  } catch (e) {
    console.error("[notify-mail] error:", subject, e);
  }
}

const FOOTER_HTML = `<br/><br/><div style="color:#7C3AED;font-weight:700;">[DentalX CRM]</div>`;
const FOOTER_TXT = "\n\n[DentalX CRM]";

export async function sendTahsilatMail(p: {
  advisor?: string;
  customerName?: string;
  date?: string;
  amount?: number;
  currency?: string;
  isUpdate?: boolean;
}) {
  const date = p.date ? fmtDate(p.date) : "Tarihi Henüz Belli Değil";
  const amount = `${(p.amount ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${p.currency || "EUR"}`;
  const prefix = p.isUpdate ? "🔄 Düzeltme: " : "";
  const intro = p.isUpdate
    ? "Mevcut bir tahsilat kaydı güncellenmiştir. Güncel detaylar aşağıdadır:"
    : "Sistemde yeni bir tahsilat yapılmıştır. Detaylar aşağıda bilginize sunulmuştur:";
  const subject = `${prefix}💰 Tahsilat Bilgilendirme – ${p.customerName || "-"} (${amount})`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
      <p>${intro}</p>
      <p>📌 <b>İşlem Türü:</b> Tahsilat${p.isUpdate ? " (Düzeltme)" : ""}<br/>
      👤 <b>Müşteri Temsilcisi:</b> ${p.advisor || "-"}<br/>
      🏢 <b>Müşteri:</b> ${p.customerName || "-"}<br/>
      📅 <b>Tarih:</b> ${date}</p>
      <p>💰 <b>Tahsil Edilen Tutar:</b> ${amount}</p>
      ${FOOTER_HTML}
    </div>`;
  const text = `${intro}\n\nİşlem Türü: Tahsilat${p.isUpdate ? " (Düzeltme)" : ""}\nMüşteri Temsilcisi: ${p.advisor || "-"}\nMüşteri: ${p.customerName || "-"}\nTarih: ${date}\nTahsil Edilen Tutar: ${amount}${FOOTER_TXT}`;
  await send(subject, html, text);
}

export async function sendSatisMail(p: {
  advisor?: string;
  customerName?: string;
  category?: string;
  dateTime?: string;
}) {
  const dt = fmtDateTime(p.dateTime || new Date().toISOString());
  const subject = `🎉 Satış Bilgilendirme – ${p.customerName || "-"}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
      <p>👤 <b>Müşteri Temsilcisi:</b> ${p.advisor || "-"}<br/>
      🏢 <b>Müşteri:</b> ${p.customerName || "-"}<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;<b>Kategori:</b> ${p.category || "-"}<br/>
      📅 <b>Tarih & Saat:</b> ${dt}</p>
      <p>Bilginize sunar, iyi çalışmalar dileriz.</p>
      <p>Saygılarımızla,</p>
      ${FOOTER_HTML}
    </div>`;
  const text = `Müşteri Temsilcisi: ${p.advisor || "-"}\nMüşteri: ${p.customerName || "-"}\nKategori: ${p.category || "-"}\nTarih & Saat: ${dt}\n\nBilginize sunar, iyi çalışmalar dileriz.\n\nSaygılarımızla,${FOOTER_TXT}`;
  await send(subject, html, text);
}

export async function sendVisitMail(p: {
  advisor?: string;
  customerName?: string;
  tripName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  doctor?: string;
  hotel?: string;
  roomType?: string;
  peopleCount?: string | number;
  transferCompany?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  arrivalFlightCode?: string;
  departureDate?: string;
  departureTime?: string;
  departureFlightCode?: string;
  notes?: string;
  amount?: number;
  currency?: string;
  dateUndetermined?: boolean;
  isUpdate?: boolean;
}) {
  const apptDate = p.dateUndetermined ? "Belirsiz" : (p.appointmentDate ? fmtDate(p.appointmentDate) : "-");
  const apptTime = p.appointmentTime || "";
  const apptStr = apptTime && apptDate !== "-" && apptDate !== "Belirsiz" ? `${apptDate} / ${apptTime}` : apptDate;
  const amountStr = p.amount && p.amount > 0
    ? `${p.amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${p.currency || "EUR"}`
    : "-";
  const arrival = p.arrivalDate
    ? `${fmtDate(p.arrivalDate)}${p.arrivalTime ? " / " + p.arrivalTime : ""}${p.arrivalFlightCode ? " (" + p.arrivalFlightCode + ")" : ""}`
    : "";
  const departure = p.departureDate
    ? `${fmtDate(p.departureDate)}${p.departureTime ? " / " + p.departureTime : ""}${p.departureFlightCode ? " (" + p.departureFlightCode + ")" : ""}`
    : "";
  const prefix = p.isUpdate ? "🔄 Düzeltme: " : "";
  const subject = `${prefix}📅 Visit Bilgilendirme – ${p.customerName || "-"} (${apptDate})`;
  const intro = p.isUpdate
    ? "Mevcut bir visit (seyahat) kaydı güncellenmiştir. Güncel detaylar aşağıdadır:"
    : "Sistemde yeni bir visit (seyahat) kaydı oluşturulmuştur. Detaylar aşağıda bilginize sunulmuştur:";

  const rows: string[] = [
    `📌 <b>İşlem Türü:</b> Visit${p.isUpdate ? " (Düzeltme)" : ""} (${p.tripName || "Seyahat"})`,
    `👤 <b>Müşteri Temsilcisi:</b> ${p.advisor || "-"}`,
    `🏢 <b>Müşteri:</b> ${p.customerName || "-"}`,
    `📅 <b>Randevu Tarihi:</b> ${apptStr}`,
  ];
  if (p.doctor) rows.push(`🦷 <b>Doktor:</b> ${p.doctor}`);
  if (p.hotel) rows.push(`🏨 <b>Otel:</b> ${p.hotel}${p.roomType ? " — " + p.roomType : ""}${p.peopleCount ? " (" + p.peopleCount + " kişi)" : ""}`);
  if (p.transferCompany) rows.push(`🚐 <b>Transfer:</b> ${p.transferCompany}`);
  if (arrival) rows.push(`✈️ <b>Geliş:</b> ${arrival}`);
  if (departure) rows.push(`✈️ <b>Dönüş:</b> ${departure}`);
  rows.push(`💰 <b>Tahsil Edilecek Tutar:</b> ${amountStr}`);
  if (p.notes) rows.push(`📝 <b>Not:</b> ${p.notes.replace(/\n/g, "<br/>")}`);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
      <p>${intro}</p>
      <p>${rows.join("<br/>")}</p>
      <p>Detaylı bilgiye sistem üzerinden ulaşabilirsiniz.</p>
      ${FOOTER_HTML}
    </div>`;
  const text = `${intro}\n\n${rows.map(r => r.replace(/<\/?b>/g, "")).join("\n")}\n\nDetaylı bilgiye sistem üzerinden ulaşabilirsiniz.${FOOTER_TXT}`;
  await send(subject, html, text);
}
