import Database from "better-sqlite3";
import path from "path";

const SQLITE_DB_PATH = path.join(process.cwd(), "crm.db");

async function transferAdvisor(fromAdvisor: string, toAdvisor: string) {
  console.log(`Starting transfer from "${fromAdvisor}" to "${toAdvisor}"...`);
  
  const db = new Database(SQLITE_DB_PATH);
  
  // Get all customers with the old advisor
  const customers = db.prepare(`
    SELECT * FROM customers WHERE advisor = ?
  `).all(fromAdvisor) as any[];
  
  console.log(`Found ${customers.length} customers to transfer`);
  
  if (customers.length === 0) {
    console.log("No customers found. Transfer complete.");
    db.close();
    return;
  }
  
  // Update each customer's data JSON to reflect the new advisor
  const updateStmt = db.prepare(`
    UPDATE customers 
    SET advisor = ?, 
        data = ?,
        updatedAt = datetime('now')
    WHERE id = ?
  `);
  
  const updateMany = db.transaction((items: any[]) => {
    for (const customer of items) {
      let fullData: any = {};
      try {
        fullData = customer.data ? JSON.parse(customer.data) : {};
      } catch (e) {
        console.error(`Error parsing data for customer ${customer.id}:`, e);
        fullData = {};
      }
      
      // Update advisor in the full data object
      fullData.advisor = toAdvisor;
      
      // Also update in status object if it exists
      if (fullData.status && typeof fullData.status === 'object') {
        fullData.status.consultant = toAdvisor;
      }
      
      const updatedData = JSON.stringify(fullData);
      updateStmt.run(toAdvisor, updatedData, customer.id);
    }
  });
  
  updateMany(customers);
  
  console.log(`Successfully transferred ${customers.length} customers from "${fromAdvisor}" to "${toAdvisor}"`);
  
  // Verify the transfer
  const remaining = db.prepare(`
    SELECT COUNT(*) as count FROM customers WHERE advisor = ?
  `).get(fromAdvisor) as any;
  
  const transferred = db.prepare(`
    SELECT COUNT(*) as count FROM customers WHERE advisor = ?
  `).get(toAdvisor) as any;
  
  console.log(`\nVerification:`);
  console.log(`- Customers still with "${fromAdvisor}": ${remaining.count}`);
  console.log(`- Customers now with "${toAdvisor}": ${transferred.count}`);
  
  db.close();
}

// Run the transfer
const fromAdvisor = process.argv[2] || "Merve Yıldız";
const toAdvisor = process.argv[3] || "Sonege";

transferAdvisor(fromAdvisor, toAdvisor).catch(console.error);
