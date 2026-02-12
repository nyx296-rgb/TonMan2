
import { neon } from '@neondatabase/serverless';
import { 
  User, Toner, Unit, UnitToner, UnitSector, Transaction, TransactionType, RequestStatus, UserRole, TonerRequest 
} from '../types';

const DATABASE_URL = 'postgresql://neondb_owner:npg_Sdw7mCgU3WrF@ep-ancient-waterfall-aixg2v07-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

class StorageService {
  public lastError: string | null = null;

  // Initialize the database schema and seed data if needed
  async initDatabase() {
    try {
      this.lastError = null;
      
      // Ultra-fast connection test
      await Promise.race([
        sql`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de Conexão com a Nuvem")), 8000))
      ]);

      await sql`CREATE TABLE IF NOT EXISTS units (id TEXT PRIMARY KEY, name TEXT NOT NULL, display_order INTEGER DEFAULT 0)`;
      await sql`CREATE TABLE IF NOT EXISTS toners (id TEXT PRIMARY KEY, model TEXT NOT NULL, color TEXT NOT NULL, active BOOLEAN DEFAULT true)`;
      await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL, display_name TEXT NOT NULL, email TEXT NOT NULL, permissions JSONB DEFAULT '[]')`;
      await sql`CREATE TABLE IF NOT EXISTS unit_toners (id TEXT PRIMARY KEY, unit_id TEXT REFERENCES units(id) ON DELETE CASCADE, toner_id TEXT REFERENCES toners(id) ON DELETE CASCADE, quantity INTEGER DEFAULT 0, min_stock_alert INTEGER DEFAULT 5, is_active BOOLEAN DEFAULT true)`;
      await sql`CREATE TABLE IF NOT EXISTS unit_sectors (id TEXT PRIMARY KEY, unit_id TEXT REFERENCES units(id) ON DELETE CASCADE, name TEXT NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, type TEXT NOT NULL, quantity INTEGER NOT NULL, reason TEXT, user_id TEXT, toner_id TEXT, unit_id TEXT, timestamp TIMESTAMPTZ DEFAULT NOW())`;
      await sql`CREATE TABLE IF NOT EXISTS toner_requests (id TEXT PRIMARY KEY, status TEXT NOT NULL, quantity INTEGER NOT NULL, sector_name TEXT, requestor_id TEXT, toner_id TEXT, unit_id TEXT, timestamp TIMESTAMPTZ DEFAULT NOW())`;
      
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_id TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS sector_id TEXT`;

      const unitsCount = await sql`SELECT count(*) FROM units`;
      if (parseInt(unitsCount[0].count) === 0) {
        const unitsMap = [
          { id: 'u_hgsc', name: '001 - HGSC' },
          { id: 'u_operadora', name: '002 - Operadora' },
          { id: 'u_bangu', name: '003 - Bangu' },
          { id: 'u_cg24h', name: '004 - CG 24H' },
          { id: 'u_medprev', name: '005 - Med Prev / Workmed' },
          { id: 'u_cgamb', name: '006 - CG Amb' },
          { id: 'u_ceti', name: '007 - CETI' },
          { id: 'u_cmped', name: '009 - CM Pediátrico / Oftalmo' },
          { id: 'u_vilanova', name: '010 - Vila Nova' },
          { id: 'u_sulacap', name: '016 - Sulacap' },
          { id: 'u_quality', name: '018 - Quality' },
          { id: 'u_itcm', name: '021 - ITCM Itaguaí' },
          { id: 'u_ctab', name: 'CT - Areia Branca' },
          { id: 'u_cmi', name: 'CMI' }
        ];

        for (const un of unitsMap) {
          await sql`INSERT INTO units (id, name, display_order) VALUES (${un.id}, ${un.name}, 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`;
          const username = un.id.replace('u_', '');
          const userId = 'usr_' + username;
          const email = username + '@tonman.com';
          await sql`INSERT INTO users (id, username, password, role, display_name, email, unit_id) 
                    VALUES (${userId}, ${username}, '123', 'editor', ${un.name}, ${email}, ${un.id})
                    ON CONFLICT (username) DO UPDATE SET unit_id = EXCLUDED.unit_id`;
        }

        // Add admin user
        await sql`INSERT INTO users (id, username, password, role, display_name, email)
                  VALUES ('admin_1', 'admin', '123', 'admin', 'System Administrator', 'admin@tonman.com')
                  ON CONFLICT (username) DO NOTHING`;
        
        // Add default toners
        const defaultToners = [
          { id: 't1', model: 'TN-514K', color: 'Preto' },
          { id: 't2', model: 'TN-514C', color: 'Ciano' },
          { id: 't3', model: 'TN-514M', color: 'Magenta' },
          { id: 't4', model: 'TN-514Y', color: 'Amarelo' }
        ];
        for (const t of defaultToners) {
          await sql`INSERT INTO toners (id, model, color) VALUES (${t.id}, ${t.model}, ${t.color}) ON CONFLICT (id) DO NOTHING`;
        }
      }
    } catch (error: any) {
      this.lastError = error?.message || "Erro de rede ao conectar com Neon.";
      throw error;
    }
  }

  // Toners
  async getToners() { 
    const rows = await sql`SELECT * FROM toners WHERE active = true ORDER BY model ASC`;
    return rows as unknown as Toner[];
  }
  async createToner(model: string, color: string) {
    const id = 't_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO toners (id, model, color) VALUES (${id}, ${model}, ${color})`;
  }
  async updateToner(toner: Toner) {
    await sql`UPDATE toners SET model = ${toner.model}, color = ${toner.color}, active = ${toner.active} WHERE id = ${toner.id}`;
  }
  async deleteToner(id: string) {
    await sql`UPDATE toners SET active = false WHERE id = ${id}`;
  }

  // Units
  async getUnits() { 
    const rows = await sql`SELECT * FROM units ORDER BY name ASC`;
    return rows as unknown as Unit[];
  }
  async createUnit(name: string) {
    const id = 'u_' + name.toLowerCase().replace(/\s+/g, '_').substr(0, 10) + Math.random().toString(36).substr(2, 4);
    await sql`INSERT INTO units (id, name, display_order) VALUES (${id}, ${name}, 1)`;
  }
  async updateUnit(id: string, name: string) {
    await sql`UPDATE units SET name = ${name} WHERE id = ${id}`;
  }
  async deleteUnit(id: string) {
    await sql`DELETE FROM units WHERE id = ${id}`;
  }

  // Users
  async getUsers() { 
    const rows = await sql`SELECT * FROM users`;
    return rows.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      email: u.email,
      role: u.role as UserRole,
      unitId: u.unit_id,
      sectorId: u.sector_id,
      permissions: Array.isArray(u.permissions) ? u.permissions : []
    })) as User[];
  }
  async createUser(user: Partial<User>) {
    const id = 'usr_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO users (id, username, password, role, display_name, email, unit_id, sector_id) 
              VALUES (${id}, ${user.username}, '123', ${user.role}, ${user.displayName}, ${user.email}, ${user.unitId || null}, ${user.sectorId || null})`;
  }
  async updateUser(user: User) {
    await sql`UPDATE users SET username = ${user.username}, display_name = ${user.displayName}, email = ${user.email}, role = ${user.role}, unit_id = ${user.unitId}, sector_id = ${user.sectorId} WHERE id = ${user.id}`;
  }
  async deleteUser(id: string) {
    await sql`DELETE FROM users WHERE id = ${id}`;
  }

  // Sectors
  async getUnitSectors(unitId?: string) { 
    const rows = unitId ? await sql`SELECT * FROM unit_sectors WHERE unit_id = ${unitId}` : await sql`SELECT * FROM unit_sectors`;
    return rows.map(r => ({
      id: r.id,
      unitId: r.unit_id,
      name: r.name
    })) as UnitSector[];
  }
  async createSector(unitId: string, name: string) {
    const id = 's_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO unit_sectors (id, unit_id, name) VALUES (${id}, ${unitId}, ${name})`;
  }
  async updateSector(id: string, name: string) {
    await sql`UPDATE unit_sectors SET name = ${name} WHERE id = ${id}`;
  }
  async deleteSector(id: string) {
    await sql`DELETE FROM unit_sectors WHERE id = ${id}`;
  }

  // Stock & Transactions
  async getUnitToners() { 
    const results = await sql`SELECT * FROM unit_toners`;
    return results.map(row => ({
      id: row.id,
      unitId: row.unit_id,
      tonerId: row.toner_id,
      quantity: row.quantity,
      minStockAlert: row.min_stock_alert,
      isActive: row.is_active
    })) as UnitToner[];
  }

  async updateStock(unitId: string, tonerId: string, quantity: number, userId: string, type: TransactionType, reason: string) {
    try {
      const existing = await sql`SELECT * FROM unit_toners WHERE unit_id = ${unitId} AND toner_id = ${tonerId}`;
      
      if (existing.length > 0) {
        const newQty = (existing[0].quantity || 0) + quantity;
        if (newQty < 0) return false;
        await sql`UPDATE unit_toners SET quantity = ${newQty} WHERE id = ${existing[0].id}`;
      } else {
        if (quantity < 0) return false;
        const id = 'ut_' + Math.random().toString(36).substr(2, 9);
        await sql`INSERT INTO unit_toners (id, unit_id, toner_id, quantity) VALUES (${id}, ${unitId}, ${tonerId}, ${quantity})`;
      }

      const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
      await sql`INSERT INTO transactions (id, type, quantity, reason, user_id, toner_id, unit_id) 
                VALUES (${txId}, ${type}, ${Math.abs(quantity)}, ${reason}, ${userId}, ${tonerId}, ${unitId})`;
      
      return true;
    } catch (e) {
      console.error("Error updating stock:", e);
      return false;
    }
  }

  async transferStock(fromUnitId: string, toUnitId: string, tonerId: string, quantity: number, userId: string) {
    try {
      // Deduct from source
      const deducted = await this.updateStock(fromUnitId, tonerId, -quantity, userId, TransactionType.REMOVE, `Transferência para unidade ${toUnitId}`);
      if (!deducted) return false;

      // Add to destination
      await this.updateStock(toUnitId, tonerId, quantity, userId, TransactionType.ADD, `Transferência da unidade ${fromUnitId}`);
      
      return true;
    } catch (e) {
      console.error("Error transferring stock:", e);
      return false;
    }
  }

  async getTransactions() { 
    const rows = await sql`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100`;
    return rows.map(r => ({
      id: r.id,
      type: r.type as TransactionType,
      quantity: r.quantity,
      reason: r.reason,
      userId: r.user_id,
      tonerId: r.toner_id,
      unitId: r.unit_id,
      timestamp: r.timestamp
    })) as Transaction[];
  }

  // Requests
  async getRequests() { 
    const rows = await sql`SELECT * FROM toner_requests ORDER BY timestamp DESC`;
    return rows.map(r => ({
      id: r.id,
      status: r.status as RequestStatus,
      quantity: r.quantity,
      sectorName: r.sector_name,
      requestorId: r.requestor_id,
      tonerId: r.toner_id,
      unitId: r.unit_id,
      timestamp: r.timestamp
    })) as TonerRequest[];
  }

  async createRequest(req: Partial<TonerRequest>) {
    const id = 'req_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO toner_requests (id, status, quantity, sector_name, requestor_id, toner_id, unit_id) 
              VALUES (${id}, ${RequestStatus.PENDING}, ${req.quantity}, ${req.sectorName}, ${req.requestorId}, ${req.tonerId}, ${req.unitId})`;
  }

  async updateRequestStatus(requestId: string, status: RequestStatus) {
    await sql`UPDATE toner_requests SET status = ${status} WHERE id = ${requestId}`;
  }
}

export const storage = new StorageService();
