const Database = require("better-sqlite3");
const path = require("path");

const SQLITE_DB_PATH = path.join(process.cwd(), "crm.db");

const PHONE_PREFIX_MAP = [
  { prefix: "+353", country: "Ireland" },
  { prefix: "+351", country: "Portugal" },
  { prefix: "+358", country: "Finland" },
  { prefix: "+356", country: "Malta" },
  { prefix: "+372", country: "Estonia" },
  { prefix: "+371", country: "Latvia" },
  { prefix: "+370", country: "Lithuania" },
  { prefix: "+385", country: "Croatia" },
  { prefix: "+381", country: "Serbia" },
  { prefix: "+386", country: "Slovenia" },
  { prefix: "+420", country: "Czech Republic" },
  { prefix: "+421", country: "Slovakia" },
  { prefix: "+36", country: "Hungary" },
  { prefix: "+90", country: "Türkiye" },
  { prefix: "+44", country: "United Kingdom" },
  { prefix: "+49", country: "Germany" },
  { prefix: "+48", country: "Poland" },
  { prefix: "+33", country: "France" },
  { prefix: "+31", country: "Netherlands" },
  { prefix: "+32", country: "Belgium" },
  { prefix: "+43", country: "Austria" },
  { prefix: "+41", country: "Switzerland" },
  { prefix: "+47", country: "Norway" },
  { prefix: "+46", country: "Sweden" },
  { prefix: "+45", country: "Denmark" },
  { prefix: "+39", country: "Italy" },
  { prefix: "+34", country: "Spain" },
  { prefix: "+30", country: "Greece" },
  { prefix: "+40", country: "Romania" },
  { prefix: "+359", country: "Bulgaria" },
  { prefix: "+380", country: "Ukraine" },
  { prefix: "+7", country: "Russia" },
  { prefix: "+98", country: "Iran" },
  { prefix: "+966", country: "Saudi Arabia" },
  { prefix: "+971", country: "UAE" },
  { prefix: "+974", country: "Qatar" },
  { prefix: "+965", country: "Kuwait" },
  { prefix: "+973", country: "Bahrain" },
  { prefix: "+968", country: "Oman" },
  { prefix: "+964", country: "Iraq" },
  { prefix: "+962", country: "Jordan" },
  { prefix: "+961", country: "Lebanon" },
  { prefix: "+963", country: "Syria" },
  { prefix: "+20", country: "Egypt" },
  { prefix: "+212", country: "Morocco" },
  { prefix: "+213", country: "Algeria" },
  { prefix: "+216", country: "Tunisia" },
  { prefix: "+218", country: "Libya" },
  { prefix: "+92", country: "Pakistan" },
  { prefix: "+91", country: "India" },
  { prefix: "+880", country: "Bangladesh" },
  { prefix: "+61", country: "Australia" },
  { prefix: "+64", country: "New Zealand" },
  { prefix: "+1", country: "USA" },
  { prefix: "+52", country: "Mexico" },
  { prefix: "+55", country: "Brazil" },
  { prefix: "+54", country: "Argentina" },
  { prefix: "+56", country: "Chile" },
  { prefix: "+57", country: "Colombia" },
];

const sorted = [...PHONE_PREFIX_MAP].sort((a, b) => b.prefix.length - a.prefix.length);

function detectCountry(phone) {
  if (!phone || !phone.startsWith("+")) return null;
  const match = sorted.find((p) => phone.startsWith(p.prefix));
  return match ? match.country : null;
}

function run() {
  const db = new Database(SQLITE_DB_PATH);

  // Get all customers - update ALL (overwrite with phone-detected if phone exists)
  const rows = db.prepare("SELECT id, phone, country, data FROM customers").all();
  console.log(`Total customers: ${rows.length}`);

  const updateStmt = db.prepare(
    "UPDATE customers SET country = ?, data = ?, updatedAt = datetime('now') WHERE id = ?"
  );

  const updateMany = db.transaction((items) => {
    let updated = 0;
    let skipped = 0;

    for (const row of items) {
      const phone = row.phone || "";
      const detected = detectCountry(phone);

      // Skip if no phone or can't detect country
      if (!detected) {
        skipped++;
        continue;
      }

      // Skip if country already set correctly
      if (row.country === detected) {
        skipped++;
        continue;
      }

      // Update country in JSON data too
      let fullData = {};
      try {
        fullData = row.data ? JSON.parse(row.data) : {};
      } catch (e) {
        fullData = {};
      }

      fullData.country = detected;
      if (fullData.personal) fullData.personal.country = detected;

      updateStmt.run(detected, JSON.stringify(fullData), row.id);
      updated++;
    }

    return { updated, skipped };
  });

  const result = updateMany(rows);

  console.log(`\n✅ Done!`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Skipped (no phone or already correct): ${result.skipped}`);

  // Show country distribution
  const stats = db.prepare(
    "SELECT country, COUNT(*) as cnt FROM customers WHERE country != '' GROUP BY country ORDER BY cnt DESC LIMIT 20"
  ).all();
  console.log("\nCountry distribution (top 20):");
  for (const s of stats) {
    console.log(`  ${s.country}: ${s.cnt}`);
  }

  const noCountry = db.prepare(
    "SELECT COUNT(*) as cnt FROM customers WHERE country = '' OR country IS NULL"
  ).get();
  console.log(`\nNo country: ${noCountry.cnt}`);

  db.close();
}

run();
