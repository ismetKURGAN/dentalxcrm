const Database = require("better-sqlite3");
const path = require("path");

const SQLITE_DB_PATH = path.join(process.cwd(), "crm.db");

function updateAdvisorInJSON(fromAdvisor, toAdvisor) {
  console.log(`Updating JSON data from "${fromAdvisor}" to "${toAdvisor}"...`);
  
  const db = new Database(SQLITE_DB_PATH);
  
  // Get all customers where advisor column is already updated but JSON still has old advisor
  const customers = db.prepare(`
    SELECT id, data FROM customers 
    WHERE advisor = ? 
    AND (data LIKE ? OR data LIKE ?)
  `).all(toAdvisor, `%${fromAdvisor}%`, `%"consultant":"${fromAdvisor}"%`);
  
  console.log(`Found ${customers.length} customers with outdated JSON data`);
  
  if (customers.length === 0) {
    console.log("All JSON data is up to date.");
    db.close();
    return;
  }
  
  const updateStmt = db.prepare(`
    UPDATE customers 
    SET data = ?,
        updatedAt = datetime('now')
    WHERE id = ?
  `);
  
  let updated = 0;
  
  for (const customer of customers) {
    try {
      let fullData = JSON.parse(customer.data);
      
      // Update advisor field
      if (fullData.advisor === fromAdvisor) {
        fullData.advisor = toAdvisor;
      }
      
      // Update status.consultant field
      if (fullData.status && typeof fullData.status === 'object' && fullData.status.consultant === fromAdvisor) {
        fullData.status.consultant = toAdvisor;
      }
      
      const updatedData = JSON.stringify(fullData);
      updateStmt.run(updatedData, customer.id);
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Updated ${updated} customers...`);
      }
    } catch (e) {
      console.error(`Error updating customer ${customer.id}:`, e.message);
    }
  }
  
  console.log(`\nSuccessfully updated ${updated} customer records`);
  
  // Verify
  const remaining = db.prepare(`
    SELECT COUNT(*) as count FROM customers 
    WHERE advisor = ? 
    AND (data LIKE ? OR data LIKE ?)
  `).get(toAdvisor, `%${fromAdvisor}%`, `%"consultant":"${fromAdvisor}"%`);
  
  console.log(`Remaining records with old advisor in JSON: ${remaining.count}`);
  
  db.close();
}

const fromAdvisor = process.argv[2] || "Merve Yıldız";
const toAdvisor = process.argv[3] || "Sonege";

updateAdvisorInJSON(fromAdvisor, toAdvisor);
