
import { neon } from '@neondatabase/serverless';
import { 
  User, Toner, Unit, UnitToner, UnitSector, Transaction, TransactionType, RequestStatus, UserRole, TonerRequest 
} from '../types';

const DATABASE_URL = 'postgresql://neondb_owner:npg_Sdw7mCgU3WrF@ep-ancient-waterfall-aixg2v07-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

class StorageService {
  async initDatabase() {
    try {
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

        const sectorConfig: Record<string, string[]> = {
          'u_hgsc': ['Recepção Adulta', 'Emergência', 'TI', 'Faturamento', 'Posto Enfermagem', 'Centro Cirúrgico', 'Compras'],
          'u_operadora': ['Financeiro', 'Jurídico', 'RH', 'TI', 'Credenciamento', 'Comercial'],
          'u_itcm': ['Consultório 01', 'Recepção 01', 'TI', 'Faturamento', 'Posto Enfermagem'],
          'u_bangu': ['Recepção Principal', 'Consultório 1', 'Enfermagem']
        };

        for (const [uId, sectors] of Object.entries(sectorConfig)) {
          for (const sName of sectors) {
            const sid = `s_${uId}_${sName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            await sql`INSERT INTO unit_sectors (id, unit_id, name) VALUES (${sid}, ${uId}, ${sName}) ON CONFLICT DO NOTHING`;
          }
        }

        const tonerCatalog = [
          { model: 'RICOH SP 3710', colors: ['Preto'] },
          { model: 'RICOH P 311', colors: ['Preto'] },
          { model: 'BROTHER L5652DN', colors: ['Preto'] },
          { model: 'KONICA C258', colors: ['Preto', 'Ciano', 'Magenta', 'Amarelo'] }
        ];

        for (const t of tonerCatalog) {
          for (const color of t.colors) {
            const tid = 't_' + t.model.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + color.toLowerCase();
            await sql`INSERT INTO toners (id, model, color) VALUES (${tid}, ${t.model}, ${color}) ON CONFLICT DO NOTHING`;
            for (const un of unitsMap) {
              const utId = `ut_${un.id}_${tid}`;
              await sql`INSERT INTO unit_toners (id, unit_id, toner_id, quantity, min_stock_alert) 
                        VALUES (${utId}, ${un.id}, ${tid}, 0, 5) ON CONFLICT DO NOTHING`;
            }
          }
        }

        await sql`INSERT INTO users (id, username, password, role, display_name, email) 
                  VALUES ('usr_admin', 'admin', '123', 'admin', 'Administrador Geral', 'admin@tonman.com')
                  ON CONFLICT (username) DO NOTHING`;
      }

    } catch (error) {
      console.error("Erro Crítico no Banco:", error);
    }
  }

  // --- TONERS ---
  async createToner(model: string, color: string): Promise<void> {
    const tid = 't_' + model.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + color.toLowerCase() + '_' + Math.random().toString(36).substr(2, 5);
    await sql`INSERT INTO toners (id, model, color) VALUES (${tid}, ${model}, ${color})`;
    const units = await this.getUnits();
    for (const un of units) {
      const utId = `ut_${un.id}_${tid}`;
      await sql`INSERT INTO unit_toners (id, unit_id, toner_id, quantity, min_stock_alert) 
                VALUES (${utId}, ${un.id}, ${tid}, 0, 5) ON CONFLICT DO NOTHING`;
    }
  }

  async updateToner(toner: Partial<Toner>): Promise<void> {
    await sql`UPDATE toners SET model = ${toner.model}, color = ${toner.color}, active = ${toner.active} WHERE id = ${toner.id}`;
  }

  async deleteToner(id: string): Promise<void> {
    await sql`DELETE FROM toners WHERE id = ${id}`;
  }

  async getToners(): Promise<Toner[]> {
    const rows = await sql`SELECT * FROM toners WHERE active = true ORDER BY model ASC`;
    return rows.map(r => ({ id: r.id, model: r.model, color: r.color, active: r.active }));
  }

  // --- USERS ---
  async createUser(user: Partial<User>): Promise<void> {
    const id = 'usr_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO users (id, username, password, role, display_name, email, unit_id, sector_id, permissions) 
              VALUES (${id}, ${user.username}, '123', ${user.role}, ${user.displayName}, ${user.email || (user.username + '@tonman.com')}, ${user.unitId}, ${user.sectorId}, ${JSON.stringify(user.permissions || [])})`;
  }

  async updateUser(user: Partial<User>): Promise<void> {
    await sql`UPDATE users SET 
              display_name = ${user.displayName}, 
              email = ${user.email}, 
              role = ${user.role}, 
              unit_id = ${user.unitId}, 
              sector_id = ${user.sectorId} 
              WHERE id = ${user.id}`;
  }

  async deleteUser(id: string): Promise<void> {
    await sql`DELETE FROM users WHERE id = ${id}`;
  }

  async getUsers(): Promise<User[]> {
    const rows = await sql`SELECT * FROM users`;
    return rows.map(r => ({
      id: r.id, username: r.username, displayName: r.display_name, email: r.email,
      role: r.role as any, unitId: r.unit_id, sectorId: r.sector_id,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || [])
    }));
  }

  // --- UNITS ---
  async createUnit(name: string): Promise<void> {
    const id = 'u_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
    await sql`INSERT INTO units (id, name, display_order) VALUES (${id}, ${name}, 1)`;
    
    const toners = await this.getToners();
    for (const t of toners) {
      const utId = `ut_${id}_${t.id}`;
      await sql`INSERT INTO unit_toners (id, unit_id, toner_id, quantity, min_stock_alert) 
                VALUES (${utId}, ${id}, ${t.id}, 0, 5) ON CONFLICT DO NOTHING`;
    }
  }

  async updateUnit(id: string, name: string): Promise<void> {
    await sql`UPDATE units SET name = ${name} WHERE id = ${id}`;
  }

  async deleteUnit(id: string): Promise<void> {
    await sql`DELETE FROM units WHERE id = ${id}`;
  }

  async getUnits(): Promise<Unit[]> {
    const rows = await sql`SELECT * FROM units ORDER BY name ASC`;
    return rows.map(r => ({ id: r.id, name: r.name, displayOrder: r.display_order }));
  }

  // --- SECTORS ---
  async createSector(unitId: string, name: string): Promise<void> {
    const sid = `s_${unitId}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substr(2, 4)}`;
    await sql`INSERT INTO unit_sectors (id, unit_id, name) VALUES (${sid}, ${unitId}, ${name})`;
  }

  async updateSector(id: string, name: string): Promise<void> {
    await sql`UPDATE unit_sectors SET name = ${name} WHERE id = ${id}`;
  }

  async deleteSector(id: string): Promise<void> {
    await sql`DELETE FROM unit_sectors WHERE id = ${id}`;
  }

  async getUnitSectors(unitId?: string): Promise<UnitSector[]> {
    const rows = unitId 
      ? await sql`SELECT * FROM unit_sectors WHERE unit_id = ${unitId} ORDER BY name ASC`
      : await sql`SELECT * FROM unit_sectors ORDER BY name ASC`;
    return rows.map(r => ({ id: r.id, unitId: r.unit_id, name: r.name }));
  }

  // --- STOCK & REQUESTS ---
  async getUnitToners(): Promise<UnitToner[]> {
    const rows = await sql`SELECT * FROM unit_toners`;
    return rows.map(r => ({
      id: r.id, unitId: r.unit_id, tonerId: r.toner_id, quantity: r.quantity,
      minStockAlert: r.min_stock_alert, isActive: r.is_active
    }));
  }

  async updateStock(unitId: string, tonerId: string, amount: number, userId: string, type: string, reason: string): Promise<boolean> {
    try {
      await sql`UPDATE unit_toners SET quantity = quantity + ${amount} WHERE unit_id = ${unitId} AND toner_id = ${tonerId}`;
      const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
      await sql`INSERT INTO transactions (id, type, quantity, reason, user_id, toner_id, unit_id)
                VALUES (${txId}, ${type}, ${Math.abs(amount)}, ${reason}, ${userId}, ${tonerId}, ${unitId})`;
      return true;
    } catch (e) { return false; }
  }

  async transferStock(sourceUnitId: string, targetUnitId: string, tonerId: string, quantity: number, userId: string): Promise<boolean> {
    try {
      const sourceStock = await sql`SELECT quantity FROM unit_toners WHERE unit_id = ${sourceUnitId} AND toner_id = ${tonerId}`;
      if (!sourceStock[0] || sourceStock[0].quantity < quantity) return false;

      // 1. Remove from source
      await sql`UPDATE unit_toners SET quantity = quantity - ${quantity} WHERE unit_id = ${sourceUnitId} AND toner_id = ${tonerId}`;
      
      // 2. Add to target
      await sql`UPDATE unit_toners SET quantity = quantity + ${quantity} WHERE unit_id = ${targetUnitId} AND toner_id = ${tonerId}`;
      
      // 3. Log transaction
      const txId = 'tx_trans_' + Math.random().toString(36).substr(2, 9);
      await sql`INSERT INTO transactions (id, type, quantity, reason, user_id, toner_id, unit_id)
                VALUES (${txId}, 'TRANSFER', ${quantity}, ${`Transferência para unidade ${targetUnitId}`}, ${userId}, ${tonerId}, ${sourceUnitId})`;
      
      return true;
    } catch (e) {
      console.error("Erro na transferência:", e);
      return false;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    const rows = await sql`SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100`;
    return rows.map(r => ({
      id: r.id, type: r.type as any, quantity: r.quantity, reason: r.reason,
      userId: r.user_id, tonerId: r.toner_id, unitId: r.unit_id,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  async getRequests(): Promise<TonerRequest[]> {
    const rows = await sql`SELECT * FROM toner_requests ORDER BY timestamp DESC`;
    return rows.map(r => ({
      id: r.id, status: r.status as any, quantity: r.quantity, sectorName: r.sector_name,
      requestorId: r.requestor_id, tonerId: r.toner_id, unitId: r.unit_id,
      timestamp: new Date(r.timestamp).toISOString()
    }));
  }

  async createRequest(request: Partial<TonerRequest>): Promise<void> {
    const id = 'req_' + Math.random().toString(36).substr(2, 9);
    await sql`INSERT INTO toner_requests (id, status, quantity, sector_name, requestor_id, toner_id, unit_id)
              VALUES (${id}, 'PENDING', ${request.quantity}, ${request.sectorName}, ${request.requestorId}, ${request.tonerId}, ${request.unitId})`;
  }

  async updateRequestStatus(requestId: string, status: string): Promise<boolean> {
    try {
      await sql`UPDATE toner_requests SET status = ${status} WHERE id = ${requestId}`;
      return true;
    } catch (e) { return false; }
  }
}

export const storage = new StorageService();
