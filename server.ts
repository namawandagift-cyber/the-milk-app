import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for local testing if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Path to server-side JSON persistence simulating Google Sheets database
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'dairy-sheets.json');

interface DatabaseStore {
  Users: any[];
  Farms: any[];
  Cows: any[];
  MilkRecords: any[];
  Expenses: any[];
  Buyers: any[];
  Sales: any[];
  Activity: any[];
  Sessions: any[];
}

const SALT = 'DairyPulseSecureUganda2026Salt';
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
}

function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function seedDefaultData(db: DatabaseStore): void {
  if (db.Users && db.Users.length > 0) return;

  const now = new Date().toISOString();
  const userId = 'USR-DEMO-001';
  const farmId = 'FARM-DEMO-001';
  const passHash = hashPassword('password123');

  // Seed default user for the farmer
  db.Users.push({
    userId,
    fullName: 'Gift Namawanda',
    email: 'namawandagift@gmail.com',
    passwordHash: passHash,
    farmId,
    createdAt: now,
    updatedAt: now,
    status: 'active',
  });

  db.Users.push({
    userId: 'USR-DEMO-002',
    fullName: 'David Kato',
    email: 'farmer@dairypulse.com',
    passwordHash: passHash,
    farmId,
    createdAt: now,
    updatedAt: now,
    status: 'active',
  });

  // Seed farm
  db.Farms.push({
    farmId,
    ownerId: userId,
    farmName: 'Pearl Dairy Farm',
    location: 'Mbarara, Uganda',
    farmPhotoUrl: '',
    cowCount: 6,
    mainMilkBuyer: 'Brookside Dairy Uganda',
    createdAt: now,
    updatedAt: now,
  });

  // Seed Cows
  const cowsData = [
    { name: 'Nalongo', tag: 'UG-101', breed: 'Friesian', status: 'Lactating', lactation: 2, lastYield: 18.5 },
    { name: 'Nakato', tag: 'UG-102', breed: 'Friesian-Jersey', status: 'Lactating', lactation: 1, lastYield: 15.0 },
    { name: 'Babirye', tag: 'UG-103', breed: 'Ayrshire', status: 'Lactating', lactation: 3, lastYield: 21.0 },
    { name: 'Mukisa', tag: 'UG-104', breed: 'Friesian', status: 'Lactating', lactation: 2, lastYield: 19.5 },
    { name: 'Namubiru', tag: 'UG-105', breed: 'Jersey', status: 'Dry', lactation: 1, lastYield: 0 },
    { name: 'Kabibi', tag: 'UG-106', breed: 'Friesian', status: 'Heifer', lactation: 0, lastYield: 0 },
  ];

  cowsData.forEach((c, idx) => {
    db.Cows.push({
      cowId: `COW-00${idx + 1}`,
      farmId,
      cowNumber: c.tag,
      earTag: c.tag,
      name: c.name,
      cowName: c.name,
      breed: c.breed,
      status: c.status,
      lactationStage: c.lactation,
      dateOfBirth: '2022-03-15',
      lastRecordedYield: c.lastYield,
      notes: 'Healthy and vaccinated',
      createdAt: now,
      updatedAt: now,
    });
  });

  // Seed Buyers
  const buyerId1 = 'BUY-001';
  const buyerId2 = 'BUY-002';
  db.Buyers.push(
    {
      buyerId: buyerId1,
      farmId,
      name: 'Brookside Dairy Uganda',
      buyerName: 'Brookside Dairy Uganda',
      buyerType: 'processor',
      phone: '+256 700 123456',
      location: 'Mbarara, Uganda',
      ratePerLitre: 1400,
      paymentTerms: 'Bi-weekly',
      createdAt: now,
      updatedAt: now,
    },
    {
      buyerId: buyerId2,
      farmId,
      name: 'Mbarara Local Cooperative',
      buyerName: 'Mbarara Local Cooperative',
      buyerType: 'cooperative',
      phone: '+256 772 987654',
      location: 'Mbarara, Uganda',
      ratePerLitre: 1350,
      paymentTerms: 'Weekly',
      createdAt: now,
      updatedAt: now,
    }
  );

  // Seed last 14 days of milk records (1 daily log with morning & evening)
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const morning = 42 + Math.floor(Math.sin(i) * 5) + (i % 3);
    const evening = 31 + Math.floor(Math.cos(i) * 4) + (i % 2);
    const total = parseFloat((morning + evening).toFixed(1));

    db.MilkRecords.push({
      recordId: `MLK-${dateStr}`,
      farmId,
      recordDate: dateStr,
      date: dateStr,
      morningLitres: morning,
      eveningLitres: evening,
      totalLitres: total,
      notes: 'Standard morning & evening milking',
      createdBy: 'Gift Namawanda',
      createdAt: dateStr + 'T17:00:00.000Z',
      updatedAt: dateStr + 'T17:00:00.000Z',
    });

    // Seed sales corresponding to production
    if (i % 2 === 0) {
      const litresSold = Math.round((morning + evening) * 0.92);
      const rate = 1400;
      const totalAmt = litresSold * rate;
      const paid = i < 4 ? Math.round(totalAmt * 0.5) : totalAmt;
      const due = totalAmt - paid;

      db.Sales.push({
        saleId: `SAL-${dateStr}`,
        farmId,
        saleDate: dateStr,
        date: dateStr,
        buyerId: buyerId1,
        buyerName: 'Brookside Dairy Uganda',
        litres: litresSold,
        litresSold: litresSold,
        pricePerLitre: rate,
        ratePerLitre: rate,
        totalAmount: totalAmt,
        amountPaid: paid,
        amountDue: due,
        paymentStatus: due === 0 ? 'paid' : 'pending',
        paymentMethod: 'Bank Transfer',
        notes: 'Bulk pickup delivered to cooling centre',
        createdBy: 'Gift Namawanda',
        createdAt: dateStr + 'T18:00:00.000Z',
        updatedAt: dateStr + 'T18:00:00.000Z',
      });
    }
  }

  // Seed recent Expenses
  const expCategories = [
    { cat: 'feed', desc: 'Dairy Meal 50kg Bags (x4)', amt: 320000, daysAgo: 10 },
    { cat: 'veterinary', desc: 'Routine deworming & mineral booster', amt: 85000, daysAgo: 7 },
    { cat: 'feed', desc: 'Hay bales & silage replenishment', amt: 180000, daysAgo: 4 },
    { cat: 'labour', desc: 'Milking & pasture attendant wages', amt: 150000, daysAgo: 2 },
    { cat: 'transport', desc: 'Cans delivery to cooling centre', amt: 40000, daysAgo: 1 },
  ];

  expCategories.forEach((ex, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - ex.daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    db.Expenses.push({
      expenseId: `EXP-00${idx + 1}`,
      farmId,
      expenseDate: dateStr,
      date: dateStr,
      category: ex.cat,
      amount: ex.amt,
      description: ex.desc,
      notes: '',
      createdBy: 'Gift Namawanda',
      createdAt: dateStr + 'T10:00:00.000Z',
      updatedAt: dateStr + 'T10:00:00.000Z',
    });
  });

  // Seed Activity
  db.Activity.push(
    {
      activityId: 'ACT-001',
      farmId,
      userId,
      action: 'Milk Recorded',
      description: 'Recorded 74.5L total production across 4 milking cows',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      activityId: 'ACT-002',
      farmId,
      userId,
      action: 'Sale Completed',
      description: 'Delivered 68L to Brookside Dairy Uganda',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      activityId: 'ACT-003',
      farmId,
      userId,
      action: 'Expense Added',
      description: 'Recorded UGX 40,000 for cans delivery transport',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    }
  );
}

function normalizeDatabase(db: DatabaseStore): boolean {
  let changed = false;

  // Normalize Cows
  if (Array.isArray(db.Cows)) {
    db.Cows.forEach(c => {
      if (!c.cowNumber && c.earTag) { c.cowNumber = c.earTag; changed = true; }
      if (!c.earTag && c.cowNumber) { c.earTag = c.cowNumber; changed = true; }
      if (!c.name && c.cowName) { c.name = c.cowName; changed = true; }
      if (!c.cowName && c.name) { c.cowName = c.name; changed = true; }
      if (!c.breed) { c.breed = 'Friesian'; changed = true; }
      if (!c.status) { c.status = 'Lactating'; changed = true; }
    });
  }

  // Normalize MilkRecords
  if (Array.isArray(db.MilkRecords)) {
    db.MilkRecords.forEach(r => {
      if (!r.recordDate && r.date) { r.recordDate = r.date; changed = true; }
      if (!r.date && r.recordDate) { r.date = r.recordDate; changed = true; }
      if (r.totalLitres === undefined && r.litres !== undefined) {
        r.totalLitres = r.litres;
        r.morningLitres = r.session === 'evening' ? 0 : r.litres;
        r.eveningLitres = r.session === 'evening' ? r.litres : 0;
        changed = true;
      }
      if (r.morningLitres === undefined) { r.morningLitres = 0; changed = true; }
      if (r.eveningLitres === undefined) { r.eveningLitres = 0; changed = true; }
      if (r.totalLitres === undefined) {
        r.totalLitres = parseFloat((r.morningLitres + r.eveningLitres).toFixed(2));
        changed = true;
      }
    });
  }

  // Normalize Expenses
  if (Array.isArray(db.Expenses)) {
    db.Expenses.forEach(e => {
      if (!e.expenseDate && e.date) { e.expenseDate = e.date; changed = true; }
      if (!e.date && e.expenseDate) { e.date = e.expenseDate; changed = true; }
      if (e.description === undefined) { e.description = ''; changed = true; }
      if (e.amount === undefined) { e.amount = 0; changed = true; }
    });
  }

  // Normalize Buyers
  if (Array.isArray(db.Buyers)) {
    db.Buyers.forEach(b => {
      if (!b.name && b.buyerName) { b.name = b.buyerName; changed = true; }
      if (!b.buyerName && b.name) { b.buyerName = b.name; changed = true; }
      if (!b.location) { b.location = 'Uganda'; changed = true; }
      if (!b.phone) { b.phone = ''; changed = true; }
    });
  }

  // Normalize Sales
  if (Array.isArray(db.Sales)) {
    db.Sales.forEach(s => {
      if (!s.saleDate && s.date) { s.saleDate = s.date; changed = true; }
      if (!s.date && s.saleDate) { s.date = s.saleDate; changed = true; }
      if (s.litres === undefined && s.litresSold !== undefined) { s.litres = s.litresSold; changed = true; }
      if (s.litresSold === undefined && s.litres !== undefined) { s.litresSold = s.litres; changed = true; }
      if (s.pricePerLitre === undefined && s.ratePerLitre !== undefined) { s.pricePerLitre = s.ratePerLitre; changed = true; }
      if (s.ratePerLitre === undefined && s.pricePerLitre !== undefined) { s.ratePerLitre = s.pricePerLitre; changed = true; }
      if (s.amountPaid === undefined) { s.amountPaid = s.totalAmount || 0; changed = true; }
      if (s.amountDue === undefined) { s.amountDue = (s.totalAmount || 0) - (s.amountPaid || 0); changed = true; }
    });
  }

  return changed;
}

function loadDatabase(): DatabaseStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const emptyDb: DatabaseStore = {
      Users: [],
      Farms: [],
      Cows: [],
      MilkRecords: [],
      Expenses: [],
      Buyers: [],
      Sales: [],
      Activity: [],
      Sessions: [],
    };
    seedDefaultData(emptyDb);
    normalizeDatabase(emptyDb);
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyDb, null, 2), 'utf8');
    return emptyDb;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const db = JSON.parse(raw);
    if (!db.Users || db.Users.length === 0) {
      seedDefaultData(db);
      normalizeDatabase(db);
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    } else {
      const wasNormalized = normalizeDatabase(db);
      if (wasNormalized) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
      }
    }
    return db;
  } catch (err) {
    console.error('Error reading database file:', err);
    const fallbackDb = {
      Users: [],
      Farms: [],
      Cows: [],
      MilkRecords: [],
      Expenses: [],
      Buyers: [],
      Sales: [],
      Activity: [],
      Sessions: [],
    };
    seedDefaultData(fallbackDb);
    normalizeDatabase(fallbackDb);
    return fallbackDb;
  }
}

function saveDatabase(db: DatabaseStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function logActivity(db: DatabaseStore, farmId: string, userId: string, action: string, description: string) {
  if (!farmId) return;
  db.Activity.push({
    activityId: generateId('ACT'),
    farmId,
    userId,
    action,
    description,
    timestamp: new Date().toISOString(),
  });
}

function validateSession(db: DatabaseStore, sessionToken?: string) {
  if (!sessionToken) return null;
  const session = db.Sessions.find(s => s.sessionToken === sessionToken);
  if (!session) return null;
  const now = Date.now();
  if (now > new Date(session.expiresAt).getTime()) return null;
  return session;
}

// ----------------------------------------------------------------
// API ROUTE HANDLER (Mimics Google Apps Script Web App endpoints)
// ----------------------------------------------------------------
app.post('/api', async (req, res) => {
  console.log('API REQUEST:', JSON.stringify(req.body, null, 2));
 const customGasUrl = process.env.GAS_API_URL; 
 console.log('GAS_API_URL:', customGasUrl);
  if (customGasUrl && customGasUrl.startsWith('http')) {
    try {
      const response = await fetch(customGasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      console.log('GAS STATUS:', response.status);
     const gasText = await response.text();

console.log('GAS RESPONSE:', gasText);

let data;

try {
  data = JSON.parse(gasText);
} catch {
  return res.status(502).json({
    success: false,
    message: 'Google Apps Script returned an invalid response.',
    raw: gasText.slice(0, 500),
  });
}

return res.status(response.status).json(data);
    } catch (err: any) {
      console.error('Google Apps Script connection failed:', err.message);
      
      return res.status(502).json({
        success: false,
        message: 'Could not connect to the Google Apps Script backend.',
      });
    }
  }

  const { action, sessionToken, data = {} } = req.body || {};
  const db = loadDatabase();

  // Public Actions
  if (action === 'initializeDatabase') {
    saveDatabase(db);
    return res.json({ success: true, message: 'Database initialized successfully with 8 sheets.' });
  }

  if (action === 'signup') {
    const { fullName, email, password } = data;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.Users.find(u => (u.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const userId = generateId('USR');
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    const newUser = {
      userId,
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash,
      farmId: null,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
    db.Users.push(newUser);

    const token = generateId('SES');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.Sessions.push({
      sessionToken: token,
      userId,
      farmId: '',
      expiresAt,
      createdAt: now,
    });

    saveDatabase(db);

    return res.json({
      success: true,
      sessionToken: token,
      data: {
        user: {
          userId,
          fullName: newUser.fullName,
          email: newUser.email,
          farmId: null,
          status: 'active',
        },
      },
      message: 'Account created successfully.',
    });
  }

  if (action === 'login') {
    const { email, password } = data;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);
    const user = db.Users.find(u => (u.email || '').toLowerCase() === cleanEmail && u.passwordHash === passwordHash);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = generateId('SES');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.Sessions.push({
      sessionToken: token,
      userId: user.userId,
      farmId: user.farmId || '',
      expiresAt,
      createdAt: now,
    });

    saveDatabase(db);

    return res.json({
      success: true,
      sessionToken: token,
      data: {
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          farmId: user.farmId || null,
          status: user.status,
        },
      },
      message: 'Login successful.',
    });
  }

  // Session verification
  const session = validateSession(db, sessionToken);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  const { userId } = session;
  const user = db.Users.find(u => u.userId === userId);
  const farmId = user ? user.farmId : session.farmId;

  switch (action) {
    case 'validateSession': {
      let farm = null;
      if (farmId) {
        farm = db.Farms.find(f => f.farmId === farmId) || null;
      }
      return res.json({
        success: true,
        data: {
          user: user
            ? {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                farmId: user.farmId || null,
                status: user.status,
              }
            : null,
          farm,
        },
      });
    }

    case 'logout': {
      db.Sessions = db.Sessions.filter(s => s.sessionToken !== sessionToken);
      saveDatabase(db);
      return res.json({ success: true, message: 'Logged out successfully.' });
    }

    case 'getCurrentUser': {
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({
        success: true,
        data: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          farmId: user.farmId || null,
        },
      });
    }

    // Farm Actions
    case 'getFarm': {
      if (!farmId) return res.json({ success: true, data: null });
      const farm = db.Farms.find(f => f.farmId === farmId) || null;
      return res.json({ success: true, data: farm });
    }

    case 'createFarm': {
      const { farmName, location, mainMilkBuyer, farmPhotoUrl } = data;
      if (!farmName || !location) {
        return res.status(400).json({ success: false, message: 'Farm name and location are required.' });
      }
      const newFarmId = generateId('FARM');
      const now = new Date().toISOString();
      const newFarm = {
        farmId: newFarmId,
        ownerId: userId,
        farmName: farmName.trim(),
        location: location.trim(),
        farmPhotoUrl: farmPhotoUrl || '',
        cowCount: 0,
        mainMilkBuyer: mainMilkBuyer ? mainMilkBuyer.trim() : '',
        createdAt: now,
        updatedAt: now,
      };
      db.Farms.push(newFarm);

      if (user) {
        user.farmId = newFarmId;
        user.updatedAt = now;
      }
      session.farmId = newFarmId;

      logActivity(db, newFarmId, userId, 'Farm Created', `Created farm "${newFarm.farmName}" in ${newFarm.location}`);
      saveDatabase(db);

      return res.json({
        success: true,
        data: newFarm,
        message: 'Farm created successfully.',
      });
    }

    case 'updateFarm': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const farm = db.Farms.find(f => f.farmId === farmId);
      if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

      if (data.farmName) farm.farmName = data.farmName.trim();
      if (data.location) farm.location = data.location.trim();
      if (data.mainMilkBuyer !== undefined) farm.mainMilkBuyer = data.mainMilkBuyer;
      if (data.farmPhotoUrl !== undefined) farm.farmPhotoUrl = data.farmPhotoUrl;
      farm.updatedAt = new Date().toISOString();

      saveDatabase(db);
      return res.json({ success: true, message: 'Farm profile updated successfully.' });
    }

    // Cows
    case 'getCows': {
      if (!farmId) return res.json({ success: true, data: [] });
      const cows = db.Cows.filter(c => c.farmId === farmId);
      return res.json({ success: true, data: cows });
    }

    case 'createCow': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { cowNumber, name, breed, dateOfBirth, status, photoUrl, notes } = data;
      if (!cowNumber) return res.status(400).json({ success: false, message: 'Cow number/tag is required.' });

      const existing = db.Cows.filter(c => c.farmId === farmId);
      if (existing.some(c => (c.cowNumber || '').toLowerCase() === cowNumber.trim().toLowerCase())) {
        return res.status(400).json({ success: false, message: `Cow with tag "${cowNumber}" already exists.` });
      }

      const cowId = generateId('COW');
      const now = new Date().toISOString();
      const newCow = {
        cowId,
        farmId,
        cowNumber: cowNumber.trim(),
        name: (name || '').trim(),
        breed: breed || 'Friesian',
        dateOfBirth: dateOfBirth || '',
        status: status || 'Lactating',
        photoUrl: photoUrl || '',
        notes: notes || '',
        createdAt: now,
        updatedAt: now,
      };
      db.Cows.push(newCow);

      const farm = db.Farms.find(f => f.farmId === farmId);
      if (farm) {
        farm.cowCount = existing.length + 1;
        farm.updatedAt = now;
      }

      logActivity(db, farmId, userId, 'Cow Added', `Added cow #${newCow.cowNumber}${newCow.name ? ` (${newCow.name})` : ''}`);
      saveDatabase(db);

      return res.json({ success: true, data: newCow, message: 'Cow added successfully.' });
    }

    case 'updateCow': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { cowId, cowNumber, name, breed, dateOfBirth, status, photoUrl, notes } = data;
      const cow = db.Cows.find(c => c.cowId === cowId && c.farmId === farmId);
      if (!cow) return res.status(404).json({ success: false, message: 'Cow not found.' });

      if (cowNumber) cow.cowNumber = cowNumber.trim();
      if (name !== undefined) cow.name = name.trim();
      if (breed) cow.breed = breed;
      if (dateOfBirth !== undefined) cow.dateOfBirth = dateOfBirth;
      if (status) cow.status = status;
      if (photoUrl !== undefined) cow.photoUrl = photoUrl;
      if (notes !== undefined) cow.notes = notes;
      cow.updatedAt = new Date().toISOString();

      logActivity(db, farmId, userId, 'Cow Updated', `Updated cow #${cow.cowNumber}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Cow updated successfully.' });
    }

    case 'deleteCow': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { cowId } = data;
      const cowIndex = db.Cows.findIndex(c => c.cowId === cowId && c.farmId === farmId);
      if (cowIndex === -1) return res.status(404).json({ success: false, message: 'Cow not found.' });

      const cow = db.Cows[cowIndex];
      db.Cows.splice(cowIndex, 1);

      const farm = db.Farms.find(f => f.farmId === farmId);
      if (farm) {
        farm.cowCount = db.Cows.filter(c => c.farmId === farmId).length;
        farm.updatedAt = new Date().toISOString();
      }

      logActivity(db, farmId, userId, 'Cow Removed', `Removed cow #${cow.cowNumber}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Cow deleted successfully.' });
    }

    // Milk Records
    case 'getMilkRecords': {
      if (!farmId) return res.json({ success: true, data: [] });
      const records = db.MilkRecords.filter(r => r.farmId === farmId).sort((a, b) =>
        (b.recordDate || '').localeCompare(a.recordDate || '')
      );
      return res.json({ success: true, data: records });
    }

    case 'createMilkRecord': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { recordDate, morningLitres, eveningLitres, notes } = data;
      if (!recordDate) return res.status(400).json({ success: false, message: 'recordDate is required.' });

      const m = parseFloat(morningLitres) || 0;
      const e = parseFloat(eveningLitres) || 0;
      const total = parseFloat((m + e).toFixed(2));

      const recordId = generateId('MILK');
      const now = new Date().toISOString();

      const newRecord = {
        recordId,
        farmId,
        recordDate,
        morningLitres: m,
        eveningLitres: e,
        totalLitres: total,
        notes: notes || '',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      db.MilkRecords.push(newRecord);

      logActivity(db, farmId, userId, 'Milk Recorded', `Recorded ${total} L on ${recordDate}`);
      saveDatabase(db);

      return res.json({ success: true, data: newRecord, message: 'Milk record saved.' });
    }

    case 'updateMilkRecord': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { recordId, recordDate, morningLitres, eveningLitres, notes } = data;
      const record = db.MilkRecords.find(r => r.recordId === recordId && r.farmId === farmId);
      if (!record) return res.status(404).json({ success: false, message: 'Milk record not found.' });

      const m = morningLitres !== undefined ? parseFloat(morningLitres) || 0 : record.morningLitres;
      const e = eveningLitres !== undefined ? parseFloat(eveningLitres) || 0 : record.eveningLitres;
      const total = parseFloat((m + e).toFixed(2));

      if (recordDate) record.recordDate = recordDate;
      record.morningLitres = m;
      record.eveningLitres = e;
      record.totalLitres = total;
      if (notes !== undefined) record.notes = notes;
      record.updatedAt = new Date().toISOString();

      logActivity(db, farmId, userId, 'Milk Record Updated', `Updated milk record for ${record.recordDate}: ${total} L`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Milk record updated.' });
    }

    case 'deleteMilkRecord': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { recordId } = data;
      const index = db.MilkRecords.findIndex(r => r.recordId === recordId && r.farmId === farmId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Milk record not found.' });

      const rec = db.MilkRecords[index];
      db.MilkRecords.splice(index, 1);

      logActivity(db, farmId, userId, 'Milk Record Deleted', `Deleted milk record for ${rec.recordDate}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Milk record deleted.' });
    }

    // Expenses
    case 'getExpenses': {
      if (!farmId) return res.json({ success: true, data: [] });
      const expenses = db.Expenses.filter(e => e.farmId === farmId).sort((a, b) =>
        (b.expenseDate || '').localeCompare(a.expenseDate || '')
      );
      return res.json({ success: true, data: expenses });
    }

    case 'createExpense': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { expenseDate, category, description, amount, notes } = data;
      if (!expenseDate || !category || !amount) {
        return res.status(400).json({ success: false, message: 'Date, category, and amount are required.' });
      }

      const amt = parseFloat(amount) || 0;
      const expenseId = generateId('EXP');
      const now = new Date().toISOString();

      const newExpense = {
        expenseId,
        farmId,
        expenseDate,
        category,
        description: (description || '').trim(),
        amount: amt,
        notes: notes || '',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      db.Expenses.push(newExpense);

      logActivity(db, farmId, userId, 'Expense Added', `Recorded UGX ${amt.toLocaleString()} for ${category}`);
      saveDatabase(db);

      return res.json({ success: true, data: newExpense, message: 'Expense added successfully.' });
    }

    case 'updateExpense': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { expenseId, expenseDate, category, description, amount, notes } = data;
      const exp = db.Expenses.find(e => e.expenseId === expenseId && e.farmId === farmId);
      if (!exp) return res.status(404).json({ success: false, message: 'Expense not found.' });

      if (expenseDate) exp.expenseDate = expenseDate;
      if (category) exp.category = category;
      if (description !== undefined) exp.description = description.trim();
      if (amount !== undefined) exp.amount = parseFloat(amount) || 0;
      if (notes !== undefined) exp.notes = notes;
      exp.updatedAt = new Date().toISOString();

      logActivity(db, farmId, userId, 'Expense Updated', `Updated expense: ${exp.category}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Expense updated.' });
    }

    case 'deleteExpense': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { expenseId } = data;
      const index = db.Expenses.findIndex(e => e.expenseId === expenseId && e.farmId === farmId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Expense not found.' });

      const exp = db.Expenses[index];
      db.Expenses.splice(index, 1);

      logActivity(db, farmId, userId, 'Expense Deleted', `Deleted expense: ${exp.category} (UGX ${exp.amount})`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Expense deleted.' });
    }

    // Buyers
    case 'getBuyers': {
      if (!farmId) return res.json({ success: true, data: [] });
      const buyers = db.Buyers.filter(b => b.farmId === farmId);
      return res.json({ success: true, data: buyers });
    }

    case 'createBuyer': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { name, phone, location } = data;
      if (!name) return res.status(400).json({ success: false, message: 'Buyer name is required.' });

      const buyerId = generateId('BUY');
      const now = new Date().toISOString();
      const newBuyer = {
        buyerId,
        farmId,
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        location: location ? location.trim() : '',
        createdAt: now,
        updatedAt: now,
      };
      db.Buyers.push(newBuyer);

      logActivity(db, farmId, userId, 'Buyer Added', `Added buyer "${newBuyer.name}"`);
      saveDatabase(db);

      return res.json({ success: true, data: newBuyer, message: 'Buyer added successfully.' });
    }

    case 'updateBuyer': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { buyerId, name, phone, location } = data;
      const buyer = db.Buyers.find(b => b.buyerId === buyerId && b.farmId === farmId);
      if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });

      if (name) buyer.name = name.trim();
      if (phone !== undefined) buyer.phone = phone.trim();
      if (location !== undefined) buyer.location = location.trim();
      buyer.updatedAt = new Date().toISOString();

      saveDatabase(db);
      return res.json({ success: true, message: 'Buyer updated.' });
    }

    case 'deleteBuyer': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { buyerId } = data;
      const index = db.Buyers.findIndex(b => b.buyerId === buyerId && b.farmId === farmId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Buyer not found.' });

      const b = db.Buyers[index];
      db.Buyers.splice(index, 1);

      logActivity(db, farmId, userId, 'Buyer Deleted', `Deleted buyer ${b.name}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Buyer deleted.' });
    }

    // Sales
    case 'getSales': {
      if (!farmId) return res.json({ success: true, data: [] });
      const buyers = db.Buyers.filter(b => b.farmId === farmId);
      const buyersMap: Record<string, string> = {};
      buyers.forEach(b => {
        buyersMap[b.buyerId] = b.name;
      });

      const sales = db.Sales.filter(s => s.farmId === farmId)
        .map(s => ({
          ...s,
          buyerName: buyersMap[s.buyerId] || 'Direct / Cash Buyer',
        }))
        .sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''));

      return res.json({ success: true, data: sales });
    }

    case 'createSale': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { buyerId, saleDate, litres, pricePerLitre, amountPaid, notes } = data;
      if (!saleDate || !litres || !pricePerLitre) {
        return res.status(400).json({ success: false, message: 'Date, litres, and price per litre are required.' });
      }

      const l = parseFloat(litres) || 0;
      const p = parseFloat(pricePerLitre) || 0;
      const total = parseFloat((l * p).toFixed(2));
      const paid = amountPaid !== undefined ? parseFloat(amountPaid) || 0 : total;
      const due = parseFloat((total - paid).toFixed(2));

      const saleId = generateId('SALE');
      const now = new Date().toISOString();

      const newSale = {
        saleId,
        farmId,
        buyerId: buyerId || '',
        saleDate,
        litres: l,
        pricePerLitre: p,
        totalAmount: total,
        amountPaid: paid,
        amountDue: due,
        notes: notes || '',
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };
      db.Sales.push(newSale);

      logActivity(db, farmId, userId, 'Sale Recorded', `Sold ${l} L for UGX ${total.toLocaleString()}`);
      saveDatabase(db);

      return res.json({ success: true, data: newSale, message: 'Sale recorded successfully.' });
    }

    case 'updateSale': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { saleId, buyerId, saleDate, litres, pricePerLitre, amountPaid, notes } = data;
      const sale = db.Sales.find(s => s.saleId === saleId && s.farmId === farmId);
      if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });

      const l = litres !== undefined ? parseFloat(litres) || 0 : sale.litres;
      const p = pricePerLitre !== undefined ? parseFloat(pricePerLitre) || 0 : sale.pricePerLitre;
      const total = parseFloat((l * p).toFixed(2));
      const paid = amountPaid !== undefined ? parseFloat(amountPaid) || 0 : sale.amountPaid;
      const due = parseFloat((total - paid).toFixed(2));

      if (buyerId !== undefined) sale.buyerId = buyerId;
      if (saleDate) sale.saleDate = saleDate;
      sale.litres = l;
      sale.pricePerLitre = p;
      sale.totalAmount = total;
      sale.amountPaid = paid;
      sale.amountDue = due;
      if (notes !== undefined) sale.notes = notes;
      sale.updatedAt = new Date().toISOString();

      logActivity(db, farmId, userId, 'Sale Updated', `Updated sale on ${sale.saleDate}`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Sale updated.' });
    }

    case 'deleteSale': {
      if (!farmId) return res.status(400).json({ success: false, message: 'No farm associated.' });
      const { saleId } = data;
      const index = db.Sales.findIndex(s => s.saleId === saleId && s.farmId === farmId);
      if (index === -1) return res.status(404).json({ success: false, message: 'Sale not found.' });

      const s = db.Sales[index];
      db.Sales.splice(index, 1);

      logActivity(db, farmId, userId, 'Sale Deleted', `Deleted sale for ${s.litres} L`);
      saveDatabase(db);
      return res.json({ success: true, message: 'Sale deleted.' });
    }

    // Dashboard Data Calculation
    case 'getDashboardData': {
      if (!farmId) {
        return res.json({
          success: true,
          data: {
            farm: null,
            todayMilk: 0,
            todayRevenue: 0,
            todayExpenses: 0,
            estimatedMargin: 0,
            cowCount: 0,
            weeklyMilk: 0,
            previousWeeklyMilk: 0,
            productionChangePct: null,
            outstandingPayments: 0,
            farmPulse: {
              status: 'getting_started',
              title: 'Farm Setup Needed',
              message: 'Complete farm setup to start recording real metrics.',
              actionHint: 'Setup Farm',
            },
            alerts: [],
            recentActivity: [],
            dailyMilkTrend: [],
            expenseBreakdown: [],
            financesComparison: [],
            totalRecordsCount: { milk: 0, cows: 0, expenses: 0, sales: 0 },
          },
        });
      }

      const farm = db.Farms.find(f => f.farmId === farmId) || null;
      const cows = db.Cows.filter(c => c.farmId === farmId);
      const milkRecords = db.MilkRecords.filter(m => m.farmId === farmId);
      const expenses = db.Expenses.filter(e => e.farmId === farmId);
      const sales = db.Sales.filter(s => s.farmId === farmId);
      const activity = db.Activity.filter(a => a.farmId === farmId)
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, 10);

      const todayStr = new Date().toISOString().split('T')[0];

      // Today's milk
      const todayMilkRecs = milkRecords.filter(r => r.recordDate === todayStr);
      const todayMilk = todayMilkRecs.reduce((acc, r) => acc + (parseFloat(r.totalLitres) || 0), 0);

      // Today's revenue & expenses
      const todayRevenue = sales
        .filter(s => s.saleDate === todayStr)
        .reduce((acc, s) => acc + (parseFloat(s.totalAmount) || 0), 0);

      const todayExpenses = expenses
        .filter(e => e.expenseDate === todayStr)
        .reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

      const estimatedMargin = todayRevenue - todayExpenses;

      // Outstanding payments across all sales
      const outstandingPayments = sales.reduce((acc, s) => acc + (parseFloat(s.amountDue) || 0), 0);

      // 7-day milk trend
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const dailyMilkTrend = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * dayMs);
        const dStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        const recs = milkRecords.filter(r => r.recordDate === dStr);
        const mTotal = recs.reduce((acc, r) => acc + (parseFloat(r.morningLitres) || 0), 0);
        const eTotal = recs.reduce((acc, r) => acc + (parseFloat(r.eveningLitres) || 0), 0);
        dailyMilkTrend.push({
          date: dStr,
          label: dayName,
          morningLitres: mTotal,
          eveningLitres: eTotal,
          totalLitres: parseFloat((mTotal + eTotal).toFixed(2)),
        });
      }

      // Current 7 days vs previous 7 days
      const currentWeekMilk = milkRecords
        .filter(r => {
          const diff = (now.getTime() - new Date(r.recordDate).getTime()) / dayMs;
          return diff >= 0 && diff < 7;
        })
        .reduce((acc, r) => acc + (parseFloat(r.totalLitres) || 0), 0);

      const prevWeekMilk = milkRecords
        .filter(r => {
          const diff = (now.getTime() - new Date(r.recordDate).getTime()) / dayMs;
          return diff >= 7 && diff < 14;
        })
        .reduce((acc, r) => acc + (parseFloat(r.totalLitres) || 0), 0);

      let productionChangePct: number | null = null;
      if (prevWeekMilk > 0 && currentWeekMilk > 0) {
        productionChangePct = parseFloat((((currentWeekMilk - prevWeekMilk) / prevWeekMilk) * 100).toFixed(1));
      }

      // Expense breakdown by category
      const expenseCatMap: Record<string, number> = {};
      let totalExpenseAmount = 0;
      expenses.forEach(e => {
        const cat = e.category || 'Other';
        const amt = parseFloat(e.amount) || 0;
        expenseCatMap[cat] = (expenseCatMap[cat] || 0) + amt;
        totalExpenseAmount += amt;
      });

      const expenseBreakdown = Object.keys(expenseCatMap)
        .map(cat => ({
          category: cat as any,
          amount: expenseCatMap[cat],
          percentage:
            totalExpenseAmount > 0 ? parseFloat(((expenseCatMap[cat] / totalExpenseAmount) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const totalRevenueAll = sales.reduce((acc, s) => acc + (parseFloat(s.totalAmount) || 0), 0);
      const financesComparison = [
        {
          period: 'Overall Records',
          revenue: totalRevenueAll,
          expenses: totalExpenseAmount,
          margin: totalRevenueAll - totalExpenseAmount,
        },
      ];

      // Farm Pulse status
      const distinctMilkDays = new Set(milkRecords.map(r => r.recordDate)).size;
      let pulseStatus: 'getting_started' | 'steady' | 'watch' | 'attention' = 'getting_started';
      let pulseTitle = 'Your farm is ready';
      let pulseMessage = "Start recording your farm's real numbers to see insights.";
      let pulseHint = '+ Record Milk';

      if (distinctMilkDays < 2) {
        pulseStatus = 'getting_started';
        pulseTitle = 'Getting Started';
        pulseMessage = 'Record milk collections for at least 2 days to generate production trends.';
        pulseHint = '+ Record Milk';
      } else if (productionChangePct !== null && productionChangePct <= -12) {
        pulseStatus = 'attention';
        pulseTitle = 'Attention';
        pulseMessage = `Milk production is down ${Math.abs(productionChangePct)}% compared with the previous 7 days.`;
        pulseHint = 'Review herd and feed records';
      } else if (productionChangePct !== null && productionChangePct < -4) {
        pulseStatus = 'watch';
        pulseTitle = 'Watch';
        pulseMessage = `Milk production is down ${Math.abs(productionChangePct)}% compared with last week.`;
        pulseHint = 'Monitor daily milk trends';
      } else if (outstandingPayments > 0 && outstandingPayments > totalRevenueAll * 0.4) {
        pulseStatus = 'watch';
        pulseTitle = 'Watch';
        pulseMessage = `Outstanding buyer balance is UGX ${outstandingPayments.toLocaleString()}.`;
        pulseHint = 'Follow up on pending sales';
      } else {
        pulseStatus = 'steady';
        pulseTitle = 'Steady';
        pulseMessage = 'Your farm production and operations are performing stably this week.';
        pulseHint = 'Keep recording daily';
      }

      // Dynamic Alerts
      const alerts = [];
      if (distinctMilkDays > 0 && todayMilk === 0) {
        alerts.push({
          id: 'alt-no-milk-today',
          type: 'info' as const,
          title: 'No milk recorded today',
          message: "Milking records haven't been entered for today yet.",
          linkTo: '/milk',
          linkText: 'Record today’s milk →',
        });
      }
      if (productionChangePct !== null && productionChangePct < -5) {
        alerts.push({
          id: 'alt-prod-drop',
          type: 'warning' as const,
          title: 'Milk production is declining',
          message: `Production is ${Math.abs(productionChangePct)}% lower than last week.`,
          linkTo: '/milk',
          linkText: 'Review production →',
        });
      }
      if (outstandingPayments > 0) {
        alerts.push({
          id: 'alt-outstanding',
          type: 'info' as const,
          title: 'Pending buyer collections',
          message: `You have UGX ${outstandingPayments.toLocaleString()} in unpaid sales.`,
          linkTo: '/sales',
          linkText: 'View sales →',
        });
      }

      return res.json({
        success: true,
        data: {
          farm,
          todayMilk,
          todayRevenue,
          todayExpenses,
          estimatedMargin,
          cowCount: cows.length,
          weeklyMilk: currentWeekMilk,
          previousWeeklyMilk: prevWeekMilk,
          productionChangePct,
          outstandingPayments,
          farmPulse: {
            status: pulseStatus,
            title: pulseTitle,
            message: pulseMessage,
            actionHint: pulseHint,
          },
          alerts,
          recentActivity: activity,
          dailyMilkTrend,
          expenseBreakdown,
          financesComparison,
          totalRecordsCount: {
            milk: milkRecords.length,
            cows: cows.length,
            expenses: expenses.length,
            sales: sales.length,
          },
        },
      });
    }

    // Reports
    case 'getReportData': {
      if (!farmId) {
        return res.json({ success: true, data: { hasSufficientData: false } });
      }

      const period = data.period || 'this_month';
      const milkRecords = db.MilkRecords.filter(m => m.farmId === farmId);
      const expenses = db.Expenses.filter(e => e.farmId === farmId);
      const sales = db.Sales.filter(s => s.farmId === farmId);
      const cows = db.Cows.filter(c => c.farmId === farmId);
      const buyers = db.Buyers.filter(b => b.farmId === farmId);

      const buyersMap: Record<string, string> = {};
      buyers.forEach(b => {
        buyersMap[b.buyerId] = b.name;
      });

      if (milkRecords.length === 0 && expenses.length === 0 && sales.length === 0) {
        return res.json({
          success: true,
          data: {
            period,
            hasSufficientData: false,
            message: 'No farm records have been logged yet to generate reports.',
          },
        });
      }

      let totalLitres = 0;
      let bestDay: { date: string; litres: number } | null = null;
      let lowestDay: { date: string; litres: number } | null = null;
      const dayLitresMap: Record<string, number> = {};

      milkRecords.forEach(r => {
        const l = parseFloat(r.totalLitres) || 0;
        totalLitres += l;
        dayLitresMap[r.recordDate] = (dayLitresMap[r.recordDate] || 0) + l;
      });

      const dates = Object.keys(dayLitresMap);
      dates.forEach(d => {
        const l = dayLitresMap[d];
        if (!bestDay || l > bestDay.litres) bestDay = { date: d, litres: l };
        if (!lowestDay || l < lowestDay.litres) lowestDay = { date: d, litres: l };
      });

      const avgDaily = dates.length > 0 ? parseFloat((totalLitres / dates.length).toFixed(1)) : 0;
      const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.totalAmount) || 0), 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
      const margin = totalRevenue - totalExpenses;
      const costPerLitre = totalLitres > 0 ? parseFloat((totalExpenses / totalLitres).toFixed(0)) : null;
      const outstanding = sales.reduce((acc, s) => acc + (parseFloat(s.amountDue) || 0), 0);

      const catMap: Record<string, number> = {};
      expenses.forEach(e => {
        const c = e.category || 'Other';
        catMap[c] = (catMap[c] || 0) + (parseFloat(e.amount) || 0);
      });
      const expensesByCategory = Object.keys(catMap)
        .map(c => ({
          category: c as any,
          amount: catMap[c],
          percentage: totalExpenses > 0 ? parseFloat(((catMap[c] / totalExpenses) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const buyerSalesMap: Record<string, { litres: number; amount: number }> = {};
      sales.forEach(s => {
        const bName = buyersMap[s.buyerId] || 'Direct / Cash Buyer';
        if (!buyerSalesMap[bName]) buyerSalesMap[bName] = { litres: 0, amount: 0 };
        buyerSalesMap[bName].litres += parseFloat(s.litres) || 0;
        buyerSalesMap[bName].amount += parseFloat(s.totalAmount) || 0;
      });
      const salesByBuyer = Object.keys(buyerSalesMap).map(bName => ({
        buyerName: bName,
        litres: parseFloat(buyerSalesMap[bName].litres.toFixed(1)),
        amount: buyerSalesMap[bName].amount,
      }));

      const lactatingCount = cows.filter(c => c.status === 'Lactating').length;
      const litresPerLactating =
        lactatingCount > 0 && dates.length > 0 ? parseFloat((avgDaily / lactatingCount).toFixed(1)) : null;

      return res.json({
        success: true,
        data: {
          period,
          startDate: dates.length > 0 ? dates.sort()[0] : '',
          endDate: dates.length > 0 ? dates.sort()[dates.length - 1] : '',
          hasSufficientData: true,
          summary: {
            milkChangePct: null,
            revenueChangePct: null,
            expensesChangePct: null,
            marginChangeAmount: null,
          },
          production: {
            totalLitres: parseFloat(totalLitres.toFixed(1)),
            averageDailyLitres: avgDaily,
            bestDay,
            lowestDay,
            dailyData: [],
          },
          financial: {
            revenue: totalRevenue,
            expenses: totalExpenses,
            estimatedMargin: margin,
            costPerLitre,
            outstandingPayments: outstanding,
            expensesByCategory,
            salesByBuyer,
          },
          farmPerformance: {
            totalCows: cows.length,
            lactatingCows: lactatingCount,
            litresPerLactatingCow: litresPerLactating,
          },
        },
      });
    }

    default:
      return res.status(400).json({ success: false, message: `Unknown API action: ${action}` });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DairyPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
