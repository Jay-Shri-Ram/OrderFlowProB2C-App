import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const DEFAULT_DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true });
}

interface ServerDatabase {
  version: number;
  lastUpdated: string;
  ownerEmail?: string;
  settings: Record<string, any>;
  tables: {
    orders: any[];
    customers: any[];
    products: any[];
    categories: any[];
    units: any[];
    importExceptions: any[];
    deletedOrders: any[];
    usedOrderIds: any[];
    auditLogs: any[];
  };
}

const DEFAULT_SERVER_DB: ServerDatabase = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  settings: {
    company: 'Mahavir Traders',
    phone: '98100 12345',
    email: 'orders@mahavirtraders.com',
    address: 'Plot 12, Azadpur Mandi, New Delhi — 110033',
    gstin: '07AAFCM1234K1Z5',
    logo: '',
    bankName: 'HDFC Bank',
    bankAcc: '50200012345678',
    bankIfsc: 'HDFC0001234',
    upi: 'mahavirtraders@hdfcbank',
    prefix: 'MT',
    middle: 'ORD',
    counter: 1001,
    palette: 'indigo',
    theme: 'dark'
  },
  tables: {
    orders: [],
    customers: [],
    products: [],
    categories: [],
    units: [],
    importExceptions: [],
    deletedOrders: [],
    usedOrderIds: [],
    auditLogs: []
  }
};

class ServerStorage {
  private userDbs: Map<string, ServerDatabase> = new Map();
  private defaultDb: ServerDatabase;

  constructor() {
    this.defaultDb = this.loadDbFile(DEFAULT_DB_FILE);
  }

  private sanitizeEmail(email: string): string {
    return (email || 'default').toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  }

  private getUserDbPath(email: string): string {
    return path.join(USERS_DIR, `${this.sanitizeEmail(email)}.json`);
  }

  private loadDbFile(filePath: string): ServerDatabase {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tables) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Could not read database file ${filePath}:`, e);
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SERVER_DB));
    try {
      fs.writeFileSync(filePath, JSON.stringify(fresh, null, 2), 'utf-8');
    } catch (e) {}
    return fresh;
  }

  public getDatabase(email?: string): ServerDatabase {
    if (!email) return this.defaultDb;
    const clean = this.sanitizeEmail(email);
    if (!this.userDbs.has(clean)) {
      const p = this.getUserDbPath(email);
      const userDb = this.loadDbFile(p);
      userDb.ownerEmail = email;
      this.userDbs.set(clean, userDb);
    }
    return this.userDbs.get(clean)!;
  }

  public saveDatabase(db: ServerDatabase, email?: string) {
    db.lastUpdated = new Date().toISOString();
    const filePath = email ? this.getUserDbPath(email) : DEFAULT_DB_FILE;
    try {
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Failed to write database file ${filePath}:`, e);
    }
  }

  public sync(action: string, table: string, data: any, email?: string) {
    if (!table) return;
    const db = this.getDatabase(email);
    if (!db.tables) {
      db.tables = { ...DEFAULT_SERVER_DB.tables };
    }

    if (table === 'settings') {
      if (data && data.value) {
        db.settings = { ...db.settings, ...data.value };
      } else if (data) {
        db.settings = { ...db.settings, ...data };
      }
      this.saveDatabase(db, email);
      return;
    }

    if (!Array.isArray(db.tables[table as keyof ServerDatabase['tables']])) {
      (db.tables as any)[table] = [];
    }
    const list = (db.tables as any)[table] as any[];

    if (action === 'put') {
      const idx = list.findIndex((item: any) => item.id === data.id || (item.oid && item.oid === data.oid));
      if (idx > -1) {
        list[idx] = { ...list[idx], ...data };
      } else {
        list.push(data);
      }
    } else if (action === 'bulkPut' && Array.isArray(data)) {
      for (const item of data) {
        const idx = list.findIndex((x: any) => x.id === item.id || (x.oid && x.oid === item.oid));
        if (idx > -1) {
          list[idx] = { ...list[idx], ...item };
        } else {
          list.push(item);
        }
      }
    } else if (action === 'delete') {
      (db.tables as any)[table] = list.filter((item: any) => item.id !== data && item.oid !== data);
    }

    this.saveDatabase(db, email);
  }

  public dump(payload: { tables?: any; settings?: any }, email?: string) {
    const db = this.getDatabase(email);
    if (payload.tables) {
      db.tables = { ...db.tables, ...payload.tables };
    }
    if (payload.settings) {
      db.settings = { ...db.settings, ...payload.settings };
    }
    this.saveDatabase(db, email);
  }

  public reset(email?: string) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_SERVER_DB));
    fresh.ownerEmail = email;
    if (email) {
      const clean = this.sanitizeEmail(email);
      this.userDbs.set(clean, fresh);
    } else {
      this.defaultDb = fresh;
    }
    this.saveDatabase(fresh, email);
    return fresh;
  }
}

const storage = new ServerStorage();

function extractUserEmail(req: Request): string | undefined {
  const h = req.headers['x-user-email'];
  if (typeof h === 'string' && h.trim()) return h.trim();
  const q = req.query.user;
  if (typeof q === 'string' && q.trim()) return q.trim();
  const b = req.body && req.body.userEmail;
  if (typeof b === 'string' && b.trim()) return b.trim();
  return undefined;
}

export async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Generous limit for high-res logo upload and large database dumps
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API router
  const apiRouter = express.Router();

  // Health and Status
  apiRouter.get('/status', (req: Request, res: Response) => {
    const userEmail = extractUserEmail(req);
    const db = storage.getDatabase(userEmail);
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      user: userEmail || 'single-user-default',
      store: db.settings?.company || 'OrderFlow Pro',
      counts: {
        orders: db.tables?.orders?.length || 0,
        customers: db.tables?.customers?.length || 0,
        products: db.tables?.products?.length || 0,
        exceptions: db.tables?.importExceptions?.length || 0
      }
    });
  });

  // Get full database for the logged-in user
  apiRouter.get('/database', (req: Request, res: Response) => {
    const userEmail = extractUserEmail(req);
    res.json(storage.getDatabase(userEmail));
  });

  // Universal Sync endpoint for real-time item / table updates
  apiRouter.post('/sync', (req: Request, res: Response) => {
    const userEmail = extractUserEmail(req);
    const { action, table, data } = req.body;
    storage.sync(action, table, data, userEmail);
    res.json({ success: true, user: userEmail || 'default' });
  });

  // Full database dump
  apiRouter.post('/database/dump', (req: Request, res: Response) => {
    const userEmail = extractUserEmail(req);
    storage.dump(req.body, userEmail);
    res.json({ success: true });
  });

  // Reset database
  apiRouter.post('/database/reset', (req: Request, res: Response) => {
    const userEmail = extractUserEmail(req);
    const reset = storage.reset(userEmail);
    res.json({ success: true, message: 'Database reset to demo state', state: reset });
  });

  app.use('/api', apiRouter);

  // Mount Vite in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[OrderFlow Pro] Single-User Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
