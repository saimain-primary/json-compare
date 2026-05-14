import { createClient } from "@supabase/supabase-js";

const bucketName = "json-version-files";
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const requiredEnv = ["SEED_USER_EMAIL", "SEED_USER_PASSWORD"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const seedUser = {
  id: process.env.SEED_USER_ID || "",
  email: process.env.SEED_USER_EMAIL,
  password: process.env.SEED_USER_PASSWORD,
  username: process.env.SEED_USERNAME || "demo_user",
  displayName: process.env.SEED_DISPLAY_NAME || "Demo User",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(daysAgo) {
  const d = new Date("2026-05-13T10:00:00Z");
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function unixTs(daysAgo) {
  return Math.floor(new Date(isoDate(daysAgo)).getTime() / 1000);
}

function pick(arr, i) {
  return arr[i % arr.length];
}

// ---------------------------------------------------------------------------
// JSON format pool — each entry is { source, target } with distinct structures
// i = compare index (makes values vary per compare without being truly random)
// ---------------------------------------------------------------------------

const formatPool = [
  // 0 — App config / feature flags (the user's example format)
  (i) => ({
    source: {
      name: "who-changed-the-response",
      version: `1.${i}.0`,
      features: pick([["paste", "format", "compare"], ["diff", "export", "share"], ["search", "filter", "sort"]], i),
      enabled: i % 2 === 0,
      config: {
        max_retries: 3,
        timeout_ms: 5000 + i * 100,
        log_level: pick(["debug", "info", "warn", "error"], i),
      },
    },
    target: {
      appName: "who-changed-the-response",
      appVersion: `1.${i}.0`,
      enabledFeatures: pick([["paste", "format", "compare"], ["diff", "export", "share"], ["search", "filter", "sort"]], i),
      isEnabled: String(i % 2 === 0),
      maxRetries: "3",
      timeoutMs: 5000 + i * 100,
      logLevel: pick(["DEBUG", "INFO", "WARN", "ERROR"], i),
    },
  }),

  // 1 — JSONAPI product detail
  (i) => ({
    source: {
      data: {
        id: `prd_${1000 + i}`,
        type: "product",
        attributes: {
          name: `Product ${i + 1}`,
          sku: `SKU-${1000 + i}`,
          price_cents: (29 + i) * 100,
          currency: "USD",
          active: i % 3 !== 0,
          stock_qty: 40 + i,
          created_at: isoDate(i + 1),
        },
        relationships: {
          category: { data: { id: `cat_${10 + (i % 5)}`, type: "category" } },
        },
      },
      meta: { request_id: `req-${i}`, api_version: "2.1" },
    },
    target: {
      id: `prd_${1000 + i}`,
      name: `Product ${i + 1}`,
      sku: `SKU-${1000 + i}`,
      price: { amount: 29 + i, currency: "usd" },
      inStock: 40 + i,
      isActive: i % 3 !== 0,
      categoryId: `cat_${10 + (i % 5)}`,
      createdAt: unixTs(i + 1),
      requestId: `req-${i}`,
      apiVersion: 2,
    },
  }),

  // 2 — Order with line items
  (i) => ({
    source: {
      order_id: `ord_${5000 + i}`,
      status: pick(["pending", "processing", "shipped", "delivered", "cancelled"], i),
      customer: {
        customer_id: `cust_${200 + i}`,
        full_name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
      },
      items: [
        {
          line_item_id: `li_${i * 2}`,
          product_id: `prd_${1000 + i}`,
          quantity: 1 + (i % 3),
          unit_price_cents: (29 + i) * 100,
        },
      ],
      totals: {
        subtotal_cents: (29 + i) * 100,
        tax_cents: Math.round((29 + i) * 5),
        grand_total_cents: (29 + i) * 100 + Math.round((29 + i) * 5),
      },
      placed_at: isoDate(i + 2),
    },
    target: {
      id: `ord_${5000 + i}`,
      orderStatus: pick(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"], i),
      customerId: `cust_${200 + i}`,
      customerName: `Customer ${i + 1}`,
      lineItems: [
        {
          id: `li_${i * 2}`,
          productId: `prd_${1000 + i}`,
          qty: 1 + (i % 3),
          unitPrice: `$${29 + i}.00`,
        },
      ],
      subtotal: 29 + i,
      tax: (29 + i) * 0.05,
      total: String((29 + i) * 1.05),
      placedAt: unixTs(i + 2),
    },
  }),

  // 3 — User profile
  (i) => ({
    source: {
      user: {
        uid: `usr_${300 + i}`,
        email_address: `user${i + 1}@example.com`,
        email_verified: i % 4 !== 0,
        display_name: `User ${i + 1}`,
        role: i % 5 === 0 ? "admin" : "member",
        preferences: {
          locale: i % 2 === 0 ? "en-US" : "my-MM",
          theme: i % 2 === 0 ? "light" : "dark",
          notifications_enabled: i % 3 !== 0,
        },
        created_at: isoDate(60 + i),
      },
    },
    target: {
      userId: `usr_${300 + i}`,
      email: `user${i + 1}@example.com`,
      emailVerified: i % 4 !== 0,
      name: `User ${i + 1}`,
      isAdmin: i % 5 === 0,
      locale: i % 2 === 0 ? "en" : "my",
      darkMode: i % 2 !== 0,
      notificationsOn: i % 3 !== 0,
      createdAt: unixTs(60 + i),
    },
  }),

  // 4 — Analytics report
  (i) => ({
    source: {
      report_id: `rpt_${700 + i}`,
      metric: pick(["page_views", "sessions", "conversions", "revenue", "bounce_rate"], i),
      period: {
        start_date: isoDate(7 + i).slice(0, 10),
        end_date: isoDate(i).slice(0, 10),
        granularity: i % 2 === 0 ? "daily" : "hourly",
      },
      data_points: Array.from({ length: 3 }, (_, j) => ({
        timestamp: isoDate(6 - j + i),
        value: 100 + i * 10 + j * 25,
        segment: j % 2 === 0 ? "organic" : "paid",
      })),
      aggregates: {
        total: 100 + i * 10 + 150,
        average: Math.round((100 + i * 10 + 150) / 3),
      },
    },
    target: {
      reportId: `rpt_${700 + i}`,
      metric: pick(["Page Views", "Sessions", "Conversions", "Revenue", "Bounce Rate"], i),
      from: isoDate(7 + i).slice(0, 10),
      to: isoDate(i).slice(0, 10),
      granularity: i % 2 === 0 ? "day" : "hour",
      series: Array.from({ length: 3 }, (_, j) => ({
        ts: unixTs(6 - j + i),
        y: 100 + i * 10 + j * 25,
        label: j % 2 === 0 ? "Organic" : "Paid",
      })),
      total: String(100 + i * 10 + 150),
      avg: Math.round((100 + i * 10 + 150) / 3),
    },
  }),

  // 5 — Auth token response
  (i) => ({
    source: {
      access_token: `eyJ_backend_token_${i}`,
      refresh_token: `refresh_${i}_abc`,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "read write",
      issued_at: isoDate(0),
      user_id: `usr_${300 + i}`,
    },
    target: {
      accessToken: `eyJ_backend_token_${i}`,
      refreshToken: `refresh_${i}_abc`,
      tokenType: "bearer",
      expiresIn: "3600",
      expiresAt: unixTs(0) + 3600,
      scopes: ["read", "write"],
      issuedAt: unixTs(0),
      userId: `usr_${300 + i}`,
    },
  }),

  // 6 — Webhook event payload
  (i) => ({
    source: {
      event_id: `evt_${800 + i}`,
      event_type: pick(["order.placed", "order.shipped", "payment.failed", "review.posted", "user.signup"], i),
      payload: {
        entity_id: `ent_${400 + i}`,
        actor_id: `usr_${300 + i}`,
        occurred_at: isoDate(i),
        details: {
          message: `Event ${i + 1} triggered`,
          severity: i % 3 === 0 ? "critical" : "info",
          tags: [`tag_${i}`, "env_production"],
        },
      },
      delivery: {
        channel: i % 2 === 0 ? "email" : "push",
        status: pick(["queued", "sent", "delivered", "failed"], i),
        attempts: i % 3,
      },
    },
    target: {
      id: `evt_${800 + i}`,
      type: pick(["order.placed", "order.shipped", "payment.failed", "review.posted", "user.signup"], i),
      entityId: `ent_${400 + i}`,
      userId: `usr_${300 + i}`,
      message: `Event ${i + 1} triggered`,
      severity: i % 3 === 0 ? "HIGH" : "INFO",
      tags: [`tag_${i}`, "production"],
      channel: i % 2 === 0 ? "EMAIL" : "PUSH",
      status: pick(["QUEUED", "SENT", "DELIVERED", "FAILED"], i),
      retries: String(i % 3),
      occurredAt: unixTs(i),
    },
  }),

  // 7 — Payment intent
  (i) => ({
    source: {
      payment_intent_id: `pi_${600 + i}`,
      amount_cents: (99 + i) * 100,
      currency: "usd",
      status: pick(["requires_payment_method", "requires_confirmation", "processing", "succeeded", "canceled"], i),
      payment_method: {
        type: pick(["card", "bank_transfer", "wallet"], i),
        card_last4: `${4000 + i}`.slice(-4),
        card_brand: pick(["visa", "mastercard", "amex"], i),
        card_exp_month: (i % 12) + 1,
        card_exp_year: 2027 + (i % 3),
      },
      created_at: isoDate(i),
      metadata: { order_id: `ord_${5000 + i}`, user_id: `usr_${300 + i}` },
    },
    target: {
      paymentId: `pi_${600 + i}`,
      amount: (99 + i),
      currency: "USD",
      status: pick(["PENDING", "CONFIRMING", "PROCESSING", "SUCCESS", "CANCELLED"], i),
      method: pick(["card", "bank", "wallet"], i),
      cardLast4: `${4000 + i}`.slice(-4),
      cardBrand: pick(["Visa", "Mastercard", "Amex"], i),
      expiryMonth: (i % 12) + 1,
      expiryYear: String(2027 + (i % 3)),
      orderId: `ord_${5000 + i}`,
      createdAt: unixTs(i),
    },
  }),

  // 8 — Inventory snapshot
  (i) => ({
    source: {
      inventory_id: `inv_${500 + i}`,
      product_id: `prd_${1000 + i}`,
      warehouse_code: pick(["yangon-main", "mandalay-01", "naypyidaw-02"], i),
      stock: {
        on_hand: 100 + i * 5,
        reserved: 10 + i,
        available: 90 + i * 4,
        incoming: i % 2 === 0 ? 50 : 0,
      },
      reorder_point: 20,
      reorder_qty: 100,
      last_counted_at: isoDate(i + 3),
      managed_by: `usr_${300 + i}`,
    },
    target: {
      inventoryId: `inv_${500 + i}`,
      productId: `prd_${1000 + i}`,
      warehouse: pick(["yangon-main", "mandalay-01", "naypyidaw-02"], i),
      onHand: 100 + i * 5,
      reserved: String(10 + i),
      available: 90 + i * 4,
      incoming: i % 2 === 0 ? 50 : null,
      reorderAt: 20,
      reorderQty: "100",
      lastCountedAt: unixTs(i + 3),
    },
  }),

  // 9 — Search results list
  (i) => ({
    source: {
      query: `search term ${i + 1}`,
      total_results: 200 + i * 10,
      page: 1,
      page_size: 20,
      results: Array.from({ length: 2 }, (_, j) => ({
        result_id: `res_${i * 10 + j}`,
        entity_type: pick(["product", "order", "user"], i + j),
        score: 0.9 - j * 0.1,
        snippet: `Matching text for term ${i + 1} result ${j + 1}`,
        highlighted_fields: ["name", "description"],
        created_at: isoDate(j + i),
      })),
      search_metadata: { took_ms: 12 + i, index: "main_v3" },
    },
    target: {
      query: `search term ${i + 1}`,
      total: 200 + i * 10,
      page: 1,
      perPage: 20,
      hits: Array.from({ length: 2 }, (_, j) => ({
        id: `res_${i * 10 + j}`,
        type: pick(["product", "order", "user"], i + j),
        relevance: String(0.9 - j * 0.1),
        snippet: `Matching text for term ${i + 1} result ${j + 1}`,
        createdAt: unixTs(j + i),
      })),
      tookMs: 12 + i,
    },
  }),

  // 10 — CDN / media asset
  (i) => ({
    source: {
      asset_id: `ast_${110 + i}`,
      file_name: `image_${i + 1}.png`,
      mime_type: pick(["image/png", "image/jpeg", "image/webp", "video/mp4"], i),
      file_size_bytes: 1024 * (50 + i * 10),
      dimensions: { width: 1920, height: 1080 },
      cdn_url: `https://cdn.example.com/assets/image_${i + 1}.png`,
      variants: {
        thumb: `https://cdn.example.com/thumb/image_${i + 1}.png`,
        medium: `https://cdn.example.com/medium/image_${i + 1}.png`,
      },
      alt_text: `Alt text for image ${i + 1}`,
      tags: [`tag_${i}`, "product-image"],
      uploaded_at: isoDate(i + 1),
      uploaded_by: `usr_${300 + i}`,
    },
    target: {
      id: `ast_${110 + i}`,
      fileName: `image_${i + 1}.png`,
      mimeType: pick(["image/png", "image/jpeg", "image/webp", "video/mp4"], i),
      sizeKb: 50 + i * 10,
      width: 1920,
      height: 1080,
      url: `https://cdn.example.com/assets/image_${i + 1}.png`,
      thumbUrl: `https://cdn.example.com/thumb/image_${i + 1}.png`,
      alt: `Alt text for image ${i + 1}`,
      tags: [`tag_${i}`, "product-image"],
      uploadedAt: unixTs(i + 1),
      uploadedBy: `usr_${300 + i}`,
    },
  }),

  // 11 — Audit log entry
  (i) => ({
    source: {
      log_id: `log_${1100 + i}`,
      action: pick(["create", "update", "delete", "view", "export"], i),
      resource_type: pick(["product", "order", "user", "collection", "compare"], i),
      resource_id: `res_${400 + i}`,
      actor: {
        user_id: `usr_${300 + i}`,
        ip_address: `192.168.${i % 255}.${(i * 3) % 255}`,
        user_agent: "Mozilla/5.0",
      },
      changes: {
        before: { status: pick(["draft", "active", "archived"], i) },
        after: { status: pick(["active", "archived", "draft"], i + 1) },
      },
      occurred_at: isoDate(i),
    },
    target: {
      id: `log_${1100 + i}`,
      action: pick(["CREATE", "UPDATE", "DELETE", "VIEW", "EXPORT"], i),
      resourceType: pick(["product", "order", "user", "collection", "compare"], i),
      resourceId: `res_${400 + i}`,
      actorId: `usr_${300 + i}`,
      actorIp: `192.168.${i % 255}.${(i * 3) % 255}`,
      before: { status: pick(["draft", "active", "archived"], i) },
      after: { status: pick(["active", "archived", "draft"], i + 1) },
      occurredAt: unixTs(i),
    },
  }),

  // 12 — Rate limit / quota status
  (i) => ({
    source: {
      plan: pick(["free", "pro", "enterprise"], i),
      quota: {
        requests_per_minute: pick([60, 600, 6000], i),
        requests_per_day: pick([1000, 50000, 1000000], i),
        storage_mb: pick([100, 10000, 1000000], i),
      },
      usage: {
        requests_this_minute: 10 + i,
        requests_today: 200 + i * 5,
        storage_used_mb: 20 + i,
      },
      reset_at: isoDate(0),
      throttled: i % 7 === 0,
    },
    target: {
      plan: pick(["FREE", "PRO", "ENTERPRISE"], i),
      limits: {
        rpm: pick([60, 600, 6000], i),
        rpd: pick([1000, 50000, 1000000], i),
        storageMb: pick([100, 10000, 1000000], i),
      },
      used: {
        rpm: 10 + i,
        rpd: 200 + i * 5,
        storageMb: String(20 + i),
      },
      resetAt: unixTs(0),
      isThrottled: i % 7 === 0,
    },
  }),

  // 13 — Health check / service status
  (i) => ({
    source: {
      service: pick(["api", "worker", "scheduler", "cdn", "database"], i),
      status: pick(["healthy", "degraded", "unhealthy"], i % 3 === 0 ? 1 : 0),
      checks: {
        database: { ok: true, latency_ms: 2 + i },
        cache: { ok: i % 5 !== 0, latency_ms: 1 },
        storage: { ok: true, latency_ms: 5 + i },
      },
      version: `2.${i % 10}.${i % 3}`,
      uptime_seconds: 86400 * (i + 1),
      checked_at: isoDate(0),
    },
    target: {
      service: pick(["api", "worker", "scheduler", "cdn", "database"], i),
      healthy: pick(["healthy", "degraded", "unhealthy"], i % 3 === 0 ? 1 : 0) === "healthy",
      db: { up: true, latencyMs: 2 + i },
      cache: { up: i % 5 !== 0, latencyMs: 1 },
      storage: { up: true, latencyMs: 5 + i },
      version: `2.${i % 10}.${i % 3}`,
      uptimeDays: i + 1,
      checkedAt: unixTs(0),
    },
  }),

  // 14 — Batch job / export status
  (i) => ({
    source: {
      job_id: `job_${1200 + i}`,
      job_type: pick(["csv_export", "pdf_report", "data_import", "email_blast", "image_resize"], i),
      status: pick(["queued", "running", "completed", "failed"], i),
      progress: {
        total_items: 100 + i * 10,
        processed_items: 50 + i * 5,
        failed_items: i % 5,
        percentage: Math.round((50 + i * 5) / (100 + i * 10) * 100),
      },
      result_url: pick([null, `https://cdn.example.com/exports/job_${i}.csv`], i % 2),
      error_message: pick([null, `Error on row ${i}`], i % 3 === 0 ? 1 : 0),
      created_at: isoDate(i + 1),
      completed_at: pick([null, isoDate(i)], i % 2),
    },
    target: {
      jobId: `job_${1200 + i}`,
      type: pick(["CSV_EXPORT", "PDF_REPORT", "DATA_IMPORT", "EMAIL_BLAST", "IMAGE_RESIZE"], i),
      status: pick(["QUEUED", "RUNNING", "DONE", "FAILED"], i),
      totalItems: 100 + i * 10,
      processedItems: 50 + i * 5,
      failedItems: String(i % 5),
      progressPct: Math.round((50 + i * 5) / (100 + i * 10) * 100),
      downloadUrl: pick([null, `https://cdn.example.com/exports/job_${i}.csv`], i % 2),
      error: pick([null, `Error on row ${i}`], i % 3 === 0 ? 1 : 0),
      createdAt: unixTs(i + 1),
      completedAt: pick([null, unixTs(i)], i % 2),
    },
  }),

  // 15 — Recommendation list
  (i) => ({
    source: {
      recommendation_id: `rec_${1300 + i}`,
      context_type: pick(["product_detail", "cart", "homepage", "post_purchase"], i),
      source_entity_id: `prd_${1000 + i}`,
      recommendations: Array.from({ length: 3 }, (_, j) => ({
        product_id: `prd_${2000 + i * 3 + j}`,
        score: parseFloat((0.95 - j * 0.05).toFixed(2)),
        reason: pick(["frequently_bought_together", "similar_attributes", "trending", "personalized"], j),
      })),
      algorithm: pick(["collaborative_filtering", "content_based", "hybrid"], i),
      generated_at: isoDate(0),
    },
    target: {
      id: `rec_${1300 + i}`,
      context: pick(["product", "cart", "home", "post_purchase"], i),
      sourceId: `prd_${1000 + i}`,
      items: Array.from({ length: 3 }, (_, j) => ({
        productId: `prd_${2000 + i * 3 + j}`,
        relevance: String(parseFloat((0.95 - j * 0.05).toFixed(2))),
        reason: pick(["bought_together", "similar", "trending", "for_you"], j),
      })),
      algorithm: pick(["cf", "cb", "hybrid"], i),
      generatedAt: unixTs(0),
    },
  }),

  // 16 — Subscription / billing plan
  (i) => ({
    source: {
      subscription_id: `sub_${1400 + i}`,
      plan_id: pick(["plan_free", "plan_pro_monthly", "plan_pro_annual", "plan_enterprise"], i),
      status: pick(["active", "trialing", "past_due", "canceled"], i),
      current_period: {
        start_date: isoDate(30),
        end_date: isoDate(0),
      },
      billing: {
        amount_cents: pick([0, 1900, 19000, 49900], i),
        currency: "USD",
        interval: pick(["none", "month", "year", "month"], i),
        next_billing_date: isoDate(-30),
      },
      seats: pick([1, 5, 10, 100], i),
      trial_ends_at: i % 2 === 0 ? isoDate(-7) : null,
    },
    target: {
      subscriptionId: `sub_${1400 + i}`,
      plan: pick(["free", "pro-monthly", "pro-annual", "enterprise"], i),
      isActive: pick(["active", "trialing", "past_due", "canceled"], i) === "active",
      status: pick(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"], i),
      periodStart: unixTs(30),
      periodEnd: unixTs(0),
      amount: pick([0, 19, 190, 499], i),
      currency: "USD",
      billingCycle: pick(["none", "monthly", "yearly", "monthly"], i),
      nextBillingAt: unixTs(-30),
      seats: String(pick([1, 5, 10, 100], i)),
      trialEndsAt: i % 2 === 0 ? unixTs(-7) : null,
    },
  }),

  // 17 — Address / geo data
  (i) => ({
    source: {
      address_id: `addr_${1500 + i}`,
      user_id: `usr_${300 + i}`,
      label: pick(["home", "work", "other"], i),
      address_line_1: `${100 + i} Main Street`,
      address_line_2: i % 2 === 0 ? `Floor ${i + 1}` : null,
      city: pick(["Yangon", "Mandalay", "Naypyidaw", "Bago"], i),
      state: pick(["Yangon Region", "Mandalay Region", "Naypyidaw Union Territory", "Bago Region"], i),
      country_code: "MM",
      postal_code: `1100${i % 9}`,
      geo: { latitude: 16.8409 + i * 0.01, longitude: 96.1735 + i * 0.01 },
      is_default: i === 0,
      created_at: isoDate(i + 10),
    },
    target: {
      id: `addr_${1500 + i}`,
      userId: `usr_${300 + i}`,
      label: pick(["Home", "Work", "Other"], i),
      line1: `${100 + i} Main Street`,
      line2: i % 2 === 0 ? `Floor ${i + 1}` : "",
      city: pick(["Yangon", "Mandalay", "Naypyidaw", "Bago"], i),
      state: pick(["Yangon", "Mandalay", "Naypyidaw", "Bago"], i),
      country: "Myanmar",
      countryCode: "MM",
      zip: `1100${i % 9}`,
      lat: String(16.8409 + i * 0.01),
      lng: String(96.1735 + i * 0.01),
      isDefault: i === 0,
      createdAt: unixTs(i + 10),
    },
  }),

  // 18 — Session / device info
  (i) => ({
    source: {
      session_id: `sess_${1600 + i}`,
      user_id: `usr_${300 + i}`,
      device: {
        platform: pick(["ios", "android", "web"], i),
        os_version: pick(["17.4", "13", "Chrome/124"], i),
        model: pick(["iPhone 15", "Pixel 8", "Desktop"], i),
        push_token: i % 2 === 0 ? `push_${i}_token_abc` : null,
      },
      location: {
        country_code: "MM",
        city: "Yangon",
        timezone: "Asia/Rangoon",
      },
      started_at: isoDate(i),
      last_active_at: isoDate(0),
      is_active: i % 4 !== 0,
    },
    target: {
      sessionId: `sess_${1600 + i}`,
      userId: `usr_${300 + i}`,
      platform: pick(["iOS", "Android", "Web"], i),
      osVersion: pick(["17.4", "13", "124"], i),
      deviceModel: pick(["iPhone 15", "Pixel 8", "Desktop"], i),
      hasPushToken: i % 2 === 0,
      country: "MM",
      city: "Yangon",
      timezone: "Asia/Rangoon",
      startedAt: unixTs(i),
      lastActiveAt: unixTs(0),
      active: String(i % 4 !== 0),
    },
  }),

  // 19 — Email campaign
  (i) => ({
    source: {
      campaign_id: `cmp_${1700 + i}`,
      name: `Campaign ${i + 1}`,
      subject: `Your ${pick(["weekly", "monthly", "daily"], i)} update is here`,
      status: pick(["draft", "scheduled", "sending", "sent", "paused"], i),
      audience: {
        list_id: `list_${10 + i}`,
        segment_id: i % 2 === 0 ? `seg_${20 + i}` : null,
        estimated_recipients: 500 + i * 50,
      },
      metrics: {
        sent_count: 480 + i * 48,
        open_rate: 0.25 + i * 0.005,
        click_rate: 0.05 + i * 0.002,
        bounce_count: i + 1,
      },
      scheduled_at: isoDate(-7 + i),
      sent_at: pick([null, isoDate(i)], i % 2),
    },
    target: {
      id: `cmp_${1700 + i}`,
      name: `Campaign ${i + 1}`,
      subject: `Your ${pick(["weekly", "monthly", "daily"], i)} update is here`,
      status: pick(["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED"], i),
      listId: `list_${10 + i}`,
      segmentId: i % 2 === 0 ? `seg_${20 + i}` : null,
      recipientCount: String(500 + i * 50),
      sent: 480 + i * 48,
      openRate: `${((0.25 + i * 0.005) * 100).toFixed(1)}%`,
      clickRate: `${((0.05 + i * 0.002) * 100).toFixed(1)}%`,
      bounces: i + 1,
      scheduledAt: unixTs(-7 + i),
      sentAt: pick([null, unixTs(i)], i % 2),
    },
  }),
];

// ---------------------------------------------------------------------------
// Collections — each compare draws from the pool by its global index
// ---------------------------------------------------------------------------

const collections = [
  {
    name: "Product API",
    compares: [
      "GET /products",
      "GET /products/:id",
      "POST /products",
      "PATCH /products/:id",
      "DELETE /products/:id",
      "GET /products/:id/variants",
      "POST /products/:id/variants",
      "GET /products/:id/inventory",
      "PATCH /products/:id/inventory",
      "GET /products/search",
      "GET /categories",
      "GET /categories/:id/products",
      "GET /brands",
      "GET /brands/:id/products",
      "POST /products/:id/images",
      "GET /products/:id/reviews",
      "POST /products/:id/reviews",
      "GET /products/:id/pricing",
      "POST /products/bulk-import",
      "GET /products/recommendations",
    ],
  },
  {
    name: "Order API",
    compares: [
      "GET /orders",
      "GET /orders/:id",
      "POST /orders",
      "PATCH /orders/:id/status",
      "DELETE /orders/:id",
      "GET /orders/:id/timeline",
      "GET /orders/:id/invoice",
      "POST /orders/:id/refund",
      "GET /orders/:id/shipment",
      "GET /orders/export",
    ],
  },
  {
    name: "User & Auth API",
    compares: [
      "GET /users/me",
      "PATCH /users/me",
      "GET /users/:id",
      "POST /auth/login",
      "POST /auth/logout",
      "POST /auth/refresh",
      "POST /auth/signup",
      "GET /users/me/sessions",
      "DELETE /users/me/sessions/:id",
      "PATCH /users/me/preferences",
    ],
  },
  {
    name: "Analytics API",
    compares: [
      "GET /analytics/overview",
      "GET /analytics/pageviews",
      "GET /analytics/sessions",
      "GET /analytics/conversions",
      "GET /analytics/revenue",
      "GET /analytics/users/active",
      "GET /analytics/events",
      "GET /analytics/funnels/:id",
      "GET /analytics/cohorts",
      "GET /analytics/export",
    ],
  },
  {
    name: "Notifications & Webhooks",
    compares: [
      "GET /notifications",
      "GET /notifications/:id",
      "PATCH /notifications/:id/read",
      "DELETE /notifications/:id",
      "POST /webhooks",
      "GET /webhooks",
      "DELETE /webhooks/:id",
      "POST /webhooks/:id/test",
      "GET /webhooks/:id/logs",
      "PATCH /notifications/read-all",
    ],
  },
  {
    name: "Mobile API",
    compares: [
      "GET /mobile/bootstrap",
      "POST /mobile/crash-report",
      "GET /mobile/remote-config",
      "GET /mobile/feature-flags",
      "POST /mobile/device-register",
    ],
  },
  {
    name: "Billing & Subscriptions",
    compares: [
      "GET /billing/subscription",
      "POST /billing/upgrade",
      "DELETE /billing/subscription",
      "GET /billing/invoices",
      "GET /billing/invoices/:id",
      "POST /billing/payment-method",
      "DELETE /billing/payment-method/:id",
      "GET /billing/usage",
    ],
  },
  {
    name: "Media & Assets",
    compares: [
      "POST /media/upload",
      "GET /media/:id",
      "DELETE /media/:id",
      "PATCH /media/:id",
      "GET /media",
      "POST /media/bulk-delete",
    ],
  },
];

// Assign a format from the pool to each compare using its global sequential index
function buildSeedCollections() {
  let globalIndex = 0;
  return collections.map((col) => ({
    name: col.name,
    compares: col.compares.map((endpoint) => {
      const idx = globalIndex++;
      const { source, target } = formatPool[idx % formatPool.length](idx);
      return {
        name: endpoint,
        versions: [
          {
            compareOptions: { key: true, value: true, valueType: true },
            diffCount: 3 + (idx % 6),
            name: `v${Math.floor(idx / 5) + 1} — schema review`,
            source,
            target,
          },
        ],
      };
    }),
  }));
}

const seedCollections = buildSeedCollections();

// ---------------------------------------------------------------------------
// Infrastructure (unchanged)
// ---------------------------------------------------------------------------

function requireEnv() {
  if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
}

function jsonBlob(value) {
  return new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
}

async function ensureUser(supabase) {
  if (seedUser.id) {
    const { data, error } = await supabase.auth.admin.getUserById(seedUser.id);
    if (error) throw error;
    if (!data.user) throw new Error(`Could not find seed user id ${seedUser.id}.`);

    await supabase.auth.admin.updateUserById(seedUser.id, {
      user_metadata: {
        display_name: seedUser.displayName,
        username: seedUser.username,
      },
    });

    return data.user;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    email_confirm: true,
    password: seedUser.password,
    user_metadata: {
      display_name: seedUser.displayName,
      username: seedUser.username,
    },
  });

  if (!createError && created.user) return created.user;

  if (!createError.message.includes("already been registered")) throw createError;

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const existingUser = data.users.find((u) => u.email === seedUser.email);
  if (!existingUser) throw new Error(`Could not find existing seed user ${seedUser.email}.`);

  await supabase.auth.admin.updateUserById(existingUser.id, {
    password: seedUser.password,
    user_metadata: {
      display_name: seedUser.displayName,
      username: seedUser.username,
    },
  });

  return existingUser;
}

async function ensureBucket(supabase) {
  const { error } = await supabase.storage.createBucket(bucketName, { public: false });
  if (error && !error.message.includes("already exists")) throw error;
}

async function clearExistingSeed(supabase, userId) {
  const paths = [];

  async function collectFiles(prefix) {
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(prefix, { limit: 1000 });
    if (error) throw error;

    for (const file of files ?? []) {
      const path = `${prefix}/${file.name}`;
      if (file.id) {
        paths.push(path);
      } else {
        await collectFiles(path);
      }
    }
  }

  await collectFiles(userId);

  if (paths.length) {
    const { error } = await supabase.storage.from(bucketName).remove(paths);
    if (error) throw error;
  }

  const { error } = await supabase.from("collections").delete().eq("user_id", userId);
  if (error) throw error;
}

async function seedProfile(supabase, userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      display_name: seedUser.displayName,
      user_id: userId,
      username: seedUser.username,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

async function seedVersionFiles({ collectionId, compareId, supabase, userId, version }) {
  const versionId = crypto.randomUUID();
  const basePath = `${userId}/${collectionId}/${compareId}/${versionId}`;
  const sourcePath = `${basePath}/source.json`;
  const targetPath = `${basePath}/target.json`;
  const sourceFile = jsonBlob(version.source);
  const targetFile = jsonBlob(version.target);

  const sourceUpload = await supabase.storage
    .from(bucketName)
    .upload(sourcePath, sourceFile, { contentType: "application/json", upsert: true });
  if (sourceUpload.error) throw sourceUpload.error;

  const targetUpload = await supabase.storage
    .from(bucketName)
    .upload(targetPath, targetFile, { contentType: "application/json", upsert: true });
  if (targetUpload.error) throw targetUpload.error;

  return {
    id: versionId,
    compare_options: version.compareOptions,
    diff_count: version.diffCount,
    name: version.name,
    source_path: sourcePath,
    source_size: sourceFile.size,
    target_path: targetPath,
    target_size: targetFile.size,
  };
}

async function seedData(supabase, userId) {
  for (const collection of seedCollections) {
    const { data: collectionRow, error: collectionError } = await supabase
      .from("collections")
      .insert({ name: collection.name, user_id: userId })
      .select("id,name")
      .single();
    if (collectionError) throw collectionError;

    for (const compare of collection.compares) {
      const { data: compareRow, error: compareError } = await supabase
        .from("compares")
        .insert({ collection_id: collectionRow.id, name: compare.name, user_id: userId })
        .select("id,name")
        .single();
      if (compareError) throw compareError;

      const versionRows = [];

      for (const version of compare.versions) {
        const fileData = await seedVersionFiles({
          collectionId: collectionRow.id,
          compareId: compareRow.id,
          supabase,
          userId,
          version,
        });
        versionRows.push({ ...fileData, compare_id: compareRow.id, user_id: userId });
      }

      const { error: versionError } = await supabase.from("compare_versions").insert(versionRows);
      if (versionError) throw versionError;
    }
  }
}

async function main() {
  requireEnv();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = await ensureUser(supabase);
  await ensureBucket(supabase);
  await clearExistingSeed(supabase, user.id);
  await seedProfile(supabase, user.id);
  await seedData(supabase, user.id);

  console.log("Seed complete");
  console.log(`User id: ${user.id}`);
  console.log(`Collections: ${seedCollections.length}`);
  console.log(`Total compares: ${seedCollections.reduce((n, c) => n + c.compares.length, 0)}`);
  if (!seedUser.id) {
    console.log(`Email: ${seedUser.email}`);
    console.log(`Password: ${seedUser.password}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
