/**
 * Live integration tests against a real Grocy server.
 * Requires a populated .env file — copy .env.example and fill in your credentials.
 *
 * Run with: npm run test:live
 */

const GrocyClient = require('../../nodes/lib/grocy-client');

const GROCY_URL = process.env.GROCY_URL;
const GROCY_API_KEY = process.env.GROCY_API_KEY;
const VERIFY_SSL = process.env.GROCY_VERIFY_SSL !== 'false';
const ALLOW_SELF_SIGNED = process.env.GROCY_ALLOW_SELF_SIGNED === 'true';
const TIMEOUT = parseInt(process.env.GROCY_TIMEOUT || '30000', 10);

const missingCreds = !GROCY_URL ||
  GROCY_URL === 'http://your-grocy-server:9283' ||
  !GROCY_API_KEY ||
  GROCY_API_KEY === 'your-api-key-here';

if (missingCreds) {
  console.warn('\n⚠  Live tests skipped — fill in .env with real Grocy credentials.\n');
}

const describeIf = missingCreds ? describe.skip : describe;

function makeClient() {
  return new GrocyClient(
    {
      apiUrl: GROCY_URL,
      credentials: { apiKey: GROCY_API_KEY },
      verifySsl: VERIFY_SSL,
      allowSelfSigned: ALLOW_SELF_SIGNED,
      timeout: TIMEOUT,
    },
    { isDevelopment: true }
  );
}

describeIf('Live Grocy API', () => {
  let client;
  let api;

  beforeAll(() => {
    client = makeClient();
    api = client.getAPI();
  });

  // ─── System ────────────────────────────────────────────────────────────────

  describe('System', () => {
    it('GET /system/info — connects and returns version info', async () => {
      const info = await api.getSystemInfo();
      expect(info).toHaveProperty('grocy_version');
    });

    it('GET /system/db-changed-time — returns a timestamp', async () => {
      const result = await api.getDbChangedTime();
      expect(result).toBeDefined();
    });
  });

  // ─── Stock ─────────────────────────────────────────────────────────────────

  describe('Stock', () => {
    it('GET /stock — returns an array', async () => {
      const stock = await api.getStock();
      expect(Array.isArray(stock)).toBe(true);
    });

    it('GET /stock/volatile — returns due/overdue/expired buckets', async () => {
      const result = await api.getVolatileStock();
      expect(result).toBeDefined();
    });
  });

  // ─── Shopping list ──────────────────────────────────────────────────────────

  describe('Shopping list', () => {
    it('GET /shoppinglist — returns an array', async () => {
      const list = await api.getShoppingList();
      expect(Array.isArray(list)).toBe(true);
    });
  });

  // ─── Recipes ───────────────────────────────────────────────────────────────

  describe('Recipes', () => {
    it('GET /recipes — returns an array via objects endpoint', async () => {
      const recipes = await api.getObjects('recipes');
      expect(Array.isArray(recipes)).toBe(true);
    });
  });

  // ─── Chores ────────────────────────────────────────────────────────────────

  describe('Chores', () => {
    it('GET /chores — returns an array', async () => {
      const chores = await api.getChores();
      expect(Array.isArray(chores)).toBe(true);
    });
  });

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  describe('Tasks', () => {
    it('GET /tasks — returns an array', async () => {
      const tasks = await api.getTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  // ─── Batteries ─────────────────────────────────────────────────────────────

  describe('Batteries', () => {
    it('GET /batteries — returns an array', async () => {
      const batteries = await api.getBatteries();
      expect(Array.isArray(batteries)).toBe(true);
    });
  });

  // ─── Objects (generic CRUD) ─────────────────────────────────────────────────

  describe('Objects (CRUD)', () => {
    it('GET /objects/locations — returns an array', async () => {
      const locations = await api.getObjects('locations');
      expect(Array.isArray(locations)).toBe(true);
    });

    it('GET /objects/quantity_units — returns an array', async () => {
      const units = await api.getObjects('quantity_units');
      expect(Array.isArray(units)).toBe(true);
    });

    it('GET /objects/product_groups — returns an array', async () => {
      const groups = await api.getObjects('product_groups');
      expect(Array.isArray(groups)).toBe(true);
    });
  });

  // ─── Users ─────────────────────────────────────────────────────────────────

  describe('Users', () => {
    it('GET /user/settings — returns current user settings object', async () => {
      const settings = await api.getCurrentUser();
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });
  });

  // ─── API key header check ───────────────────────────────────────────────────

  describe('Authentication', () => {
    it('API key is sent — bad key gets a 401 or 403', async () => {
      const badClient = new GrocyClient(
        {
          apiUrl: GROCY_URL,
          credentials: { apiKey: 'definitely-wrong-key' },
          verifySsl: VERIFY_SSL,
          allowSelfSigned: ALLOW_SELF_SIGNED,
          timeout: 5000,
        },
        { isDevelopment: true }
      );
      const badApi = badClient.getAPI();
      await expect(badApi.getSystemInfo()).rejects.toThrow();
    });
  });
});
