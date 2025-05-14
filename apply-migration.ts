import Database from 'better-sqlite3';

// Connect to the SQLite database
const db = new Database('sqlite.db');

try {
  // Start a transaction
  db.exec('BEGIN TRANSACTION;');

  console.log('Updating tickets table schema...');

  // --- Add BTCPay columns if they don't exist (idempotent) ---
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT "pending";');
    console.log('Added status column');
  } catch (err: any) {
    if (err.message.includes('duplicate column name: status')) {
      console.log('status column already exists.');
    } else { throw err; }
  }
  
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN btcpay_invoice_id TEXT;');
    console.log('Added btcpay_invoice_id column');
  } catch (err: any) {
    if (err.message.includes('duplicate column name: btcpay_invoice_id')) {
      console.log('btcpay_invoice_id column already exists.');
    } else { throw err; }
  }
  
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN reserved_at INTEGER;');
    console.log('Added reserved_at column');
  } catch (err: any) {
    if (err.message.includes('duplicate column name: reserved_at')) {
      console.log('reserved_at column already exists.');
    } else { throw err; }
  }

  // --- Modify purchased_at to allow NULL (This is the main fix) ---
  // SQLite doesn't directly support ALTER COLUMN to change constraints.
  // The common workaround is: 
  // 1. Rename the existing table.
  // 2. Create a new table with the correct schema (purchased_at nullable).
  // 3. Copy data from the old table to the new table.
  // 4. Drop the old table.

  console.log('Making purchased_at column nullable...');
  
  // 1. Rename old table
  db.exec('ALTER TABLE tickets RENAME TO tickets_old;');
  console.log('Renamed tickets to tickets_old.');
  
  // 2. Create new table with correct schema
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raffle_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      purchased_at INTEGER, -- Now nullable
      status TEXT NOT NULL DEFAULT 'pending',
      btcpay_invoice_id TEXT,
      reserved_at INTEGER
    );
  `);
  console.log('Created new tickets table with nullable purchased_at.');

  // 3. Copy data from old table to new table
  // Make sure to list columns explicitly to handle schema differences
  db.exec(`
    INSERT INTO tickets (id, raffle_id, user_id, purchased_at, status, btcpay_invoice_id, reserved_at)
    SELECT id, raffle_id, user_id, purchased_at, status, btcpay_invoice_id, reserved_at 
    FROM tickets_old;
  `);
  console.log('Copied data from tickets_old to new tickets table.');
  
  // 4. Drop the old table
  db.exec('DROP TABLE tickets_old;');
  console.log('Dropped old tickets table (tickets_old).');
  
  // Commit the transaction
  db.exec('COMMIT;');
  console.log('Schema update completed successfully!');
  
} catch (error) {
  // Rollback in case of error
  console.error('Error updating schema:', error);
  try {
    db.exec('ROLLBACK;');
    console.log('Transaction rolled back.');
    // Attempt to restore the original table if rename succeeded but subsequent steps failed
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tickets_old';").get();
    if (tableExists) {
      const originalTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tickets';").get();
      if (!originalTableExists) {
         db.exec('ALTER TABLE tickets_old RENAME TO tickets;');
         console.log('Restored original table name.');
      } else {
         console.warn('Could not restore original table name automatically.');
      }
    }
  } catch (rollbackError) {
    console.error('Rollback failed:', rollbackError);
  }
  process.exit(1);
} finally {
  // Close the database connection
  db.close();
} 