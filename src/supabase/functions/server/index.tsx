import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from './kv_store.tsx';

const app = new Hono();

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "make-245feaad-receipts";
const BANNER_BUCKET_NAME = "make-245feaad-banners";

async function ensureBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Receipt bucket (private)
    if (!buckets?.some((bucket) => bucket.name === BUCKET_NAME)) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      });
    }

    // Banner bucket (public)
    if (!buckets?.some((bucket) => bucket.name === BANNER_BUCKET_NAME)) {
      console.log(`Creating bucket: ${BANNER_BUCKET_NAME}`);
      await supabase.storage.createBucket(BANNER_BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      });
    }
  } catch (err) {
    console.error("Error ensuring bucket:", err);
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-245feaad/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Upload Receipt Endpoint
app.post("/make-server-245feaad/upload-receipt", async (c) => {
  try {
    await ensureBucket();
    
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      return c.json({ error: "Upload failed: " + error.message }, 500);
    }

    // Generate signed URL (valid for 7 days)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signedUrlError || !signedUrlData) {
       console.error("Signed URL error:", signedUrlError);
       return c.json({ error: "Failed to generate URL" }, 500);
    }

    return c.json({ url: signedUrlData.signedUrl });

  } catch (e) {
    console.error("Server error:", e);
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// Upload Banner Endpoint
app.post("/make-server-245feaad/upload-banner", async (c) => {
  try {
    await ensureBucket();
    
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const { data, error } = await supabase.storage
      .from(BANNER_BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      return c.json({ error: "Upload failed: " + error.message }, 500);
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(BANNER_BUCKET_NAME)
      .getPublicUrl(fileName);

    return c.json({ url: publicUrlData.publicUrl });

  } catch (e) {
    console.error("Server error:", e);
    return c.json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

// Site Settings Routes
app.get("/make-server-245feaad/settings", async (c) => {
  try {
    const settings = await kv.get("site_settings");
    // Default settings
    const defaultSettings = {
      orderMethod: 'messenger',
      banners: []
    };
    return c.json({ settings: settings || defaultSettings });
  } catch (e) {
    console.error("Get settings error:", e);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});

app.post("/make-server-245feaad/settings", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.settings) {
      return c.json({ error: "Invalid settings data" }, 400);
    }
    await kv.set("site_settings", body.settings);
    return c.json({ success: true });
  } catch (e) {
    console.error("Save settings error:", e);
    return c.json({ error: "Failed to save settings" }, 500);
  }
});

// Catalog Routes
app.get("/make-server-245feaad/catalog", async (c) => {
  try {
    const catalog = await kv.get("catalog");
    return c.json({ catalog: catalog || [] });
  } catch (e) {
    console.error("Get catalog error:", e);
    return c.json({ error: "Failed to fetch catalog" }, 500);
  }
});

app.post("/make-server-245feaad/catalog", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.catalog || !Array.isArray(body.catalog)) {
      return c.json({ error: "Invalid catalog data" }, 400);
    }
    await kv.set("catalog", body.catalog);
    return c.json({ success: true });
  } catch (e) {
    console.error("Save catalog error:", e);
    return c.json({ error: "Failed to save catalog" }, 500);
  }
});

app.get("/make-server-245feaad/payments", async (c) => {
  try {
    const payments = await kv.get("payments");
    return c.json({ payments: payments || [] });
  } catch (e) {
    console.error("Get payments error:", e);
    return c.json({ error: "Failed to fetch payments" }, 500);
  }
});

app.post("/make-server-245feaad/payments", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.payments || !Array.isArray(body.payments)) {
      return c.json({ error: "Invalid payments data" }, 400);
    }
    await kv.set("payments", body.payments);
    return c.json({ success: true });
  } catch (e) {
    console.error("Save payments error:", e);
    return c.json({ error: "Failed to save payments" }, 500);
  }
});

// Order Routes
app.post("/make-server-245feaad/order", async (c) => {
  try {
    const order = await c.req.json();
    const orderId = order.id || `ord_${Date.now()}`;
    // Save individual order for detail retrieval
    await kv.set(`order:${orderId}`, { ...order, timestamp: new Date().toISOString() });
    
    // Also add to a list of order IDs for easier listing if needed, 
    // but getByPrefix("order:") is better.
    
    return c.json({ success: true, id: orderId });
  } catch (e) {
    console.error("Save order error:", e);
    return c.json({ error: "Failed to save order" }, 500);
  }
});

app.get("/make-server-245feaad/orders", async (c) => {
  try {
    // Basic auth check for admin routes (using a simple header for now or just public since it's a prototype)
    // For this environment, we'll keep it open but the frontend will hide it.
    // In production, checking Authorization header against a secret is recommended.
    
    const orders = await kv.getByPrefix("order:");
    return c.json({ orders });
  } catch (e) {
    console.error("Get orders error:", e);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.get("/make-server-245feaad/order/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const order = await kv.get(`order:${id}`);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }
    return c.json({ order });
  } catch (e) {
    console.error("Get order error:", e);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

app.put("/make-server-245feaad/order/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingOrder = await kv.get(`order:${id}`);
    if (!existingOrder) {
      return c.json({ error: "Order not found" }, 404);
    }

    const updatedOrder = { ...existingOrder, ...body };
    await kv.set(`order:${id}`, updatedOrder);
    
    return c.json({ success: true, order: updatedOrder });
  } catch (e) {
    console.error("Update order error:", e);
    return c.json({ error: "Failed to update order" }, 500);
  }
});

app.delete("/make-server-245feaad/orders", async (c) => {
  try {
    const orders = await kv.getByPrefix("order:");
    if (!orders || orders.length === 0) {
      return c.json({ success: true, count: 0 });
    }
    
    const keys = orders.map((o: any) => `order:${o.id}`);
    await kv.mdel(keys);
    
    return c.json({ success: true, count: keys.length });
  } catch (e) {
    console.error("Delete orders error:", e);
    return c.json({ error: "Failed to delete orders" }, 500);
  }
});

Deno.serve(app.fetch);