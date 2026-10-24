import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerDatabase {
  version: number;
  lastUpdated: string;
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
  private db: ServerDatabase;

  constructor() {
    this.db = this.load();
  }

  private load(): ServerDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.tables) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing database.json, initializing fresh store:', e);
    }
    this.save(DEFAULT_SERVER_DB);
    return JSON.parse(JSON.stringify(DEFAULT_SERVER_DB));
  }

  public save(data?: ServerDatabase) {
    if (data) this.db = data;
    this.db.lastUpdated = new Date().toISOString();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public getDatabase(): ServerDatabase {
    return this.db;
  }

  public sync(action: string, table: string, data: any) {
    if (!table) return;
    if (!this.db.tables) {
      this.db.tables = { ...DEFAULT_SERVER_DB.tables };
    }

    if (table === 'settings') {
      if (data && data.value) {
        this.db.settings = { ...this.db.settings, ...data.value };
      } else if (data) {
        this.db.settings = { ...this.db.settings, ...data };
      }
      this.save();
      return;
    }

    if (!Array.isArray(this.db.tables[table as keyof ServerDatabase['tables']])) {
      (this.db.tables as any)[table] = [];
    }
    const list = (this.db.tables as any)[table] as any[];

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
      (this.db.tables as any)[table] = list.filter((item: any) => item.id !== data && item.oid !== data);
    }

    this.save();
  }

  public dump(payload: { tables?: any; settings?: any }) {
    if (payload.tables) {
      this.db.tables = { ...this.db.tables, ...payload.tables };
    }
    if (payload.settings) {
      this.db.settings = { ...this.db.settings, ...payload.settings };
    }
    this.save();
  }

  public reset() {
    this.db = JSON.parse(JSON.stringify(DEFAULT_SERVER_DB));
    this.save();
    return this.db;
  }
}

const storage = new ServerStorage();

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
    const db = storage.getDatabase();
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      store: db.settings?.company || 'OrderFlow Pro',
      counts: {
        orders: db.tables?.orders?.length || 0,
        customers: db.tables?.customers?.length || 0,
        products: db.tables?.products?.length || 0,
        exceptions: db.tables?.importExceptions?.length || 0
      }
    });
  });

  // Get full database
  apiRouter.get('/database', (req: Request, res: Response) => {
    res.json(storage.getDatabase());
  });

  // Universal Sync endpoint for real-time item / table updates
  apiRouter.post('/sync', (req: Request, res: Response) => {
    const { action, table, data } = req.body;
    storage.sync(action, table, data);
    res.json({ success: true });
  });

  // Full database dump
  apiRouter.post('/database/dump', (req: Request, res: Response) => {
    storage.dump(req.body);
    res.json({ success: true });
  });

  // Reset database
  apiRouter.post('/database/reset', (req: Request, res: Response) => {
    const reset = storage.reset();
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
    console.log(`[OrderFlow Pro] Live Engine on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
