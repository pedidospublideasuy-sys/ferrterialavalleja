// ============================================================
// Sistema de stock API Client
// Base URL: https://stockba.es/api/v1
// Auth: X-API-KEY header
// ============================================================

const BASE_URL = process.env.STOCK_SYSTEM_API_URL || 'https://stockba.es/api/v1';

function getApiKey(): string {
    const key = process.env.STOCK_SYSTEM_API_KEY;
    if (!key) throw new Error('STOCK_SYSTEM_API_KEY no configurada');
    return key;
}

async function stockbaFetch(path: string, options: RequestInit = {}, retries = 4) {
    const apiKey = getApiKey();
    const apiSecret = process.env.STOCK_SYSTEM_API_SECRET;
    let attempt = 0;
    while (true) {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
                'X-API-KEY': apiKey,
                ...(apiSecret ? { 'X-API-SECRET': apiSecret } : {}),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });

        if (res.status === 429 && attempt < retries) {
            // Exponential backoff: 2s, 4s, 8s, 16s
            const wait = 2000 * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, wait));
            attempt++;
            continue;
        }

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = data.message || data.error || `HTTP ${res.status}`;
            throw new Error(`Sistema de stock ${res.status}: ${msg}`);
        }
        return data;
    }
}

// ─── Products ───────────────────────────────────────────────

export async function getStockBAProducts(page = 1, perPage = 100) {
    return stockbaFetch(`/products?page=${page}&per_page=${perPage}&active=1`);
}

export async function getAllStockBAProducts() {
    const all: any[] = [];
    let page = 1;
    let lastPage = 1;
    do {
        const res = await getStockBAProducts(page, 100);
        all.push(...(res.data || []));
        lastPage = res.pagination?.last_page || 1;
        page++;
    } while (page <= lastPage);
    return all;
}

export async function getStockBAProduct(id: number) {
    return stockbaFetch(`/products/${id}`);
}

export async function getStockBAProductStock(id: number) {
    return stockbaFetch(`/products/${id}/stock`);
}

export async function updateStockBAProduct(id: number, data: Record<string, any>) {
    return stockbaFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ─── Contacts ───────────────────────────────────────────────

export async function createStockBAContact(data: {
    type: 'customer' | 'supplier' | 'both';
    name: string;
    email?: string;
    mobile?: string;
    tax_number?: string;
    address?: string;
    city?: string;
    country?: string;
}) {
    return stockbaFetch('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function findStockBAContactByEmail(email: string) {
    const res = await stockbaFetch(`/contacts?type=customer&email=${encodeURIComponent(email)}&per_page=5`);
    return res.data?.[0] || null;
}

// ─── Categories & Brands ────────────────────────────────────

export async function getStockBACategories() {
    return stockbaFetch('/categories');
}

export async function getStockBABrands() {
    return stockbaFetch('/brands');
}

// ─── Stock ──────────────────────────────────────────────────

export async function getStockBAStock() {
    return stockbaFetch('/stock?per_page=100');
}

// ─── Sells ──────────────────────────────────────────────────

export async function getStockBASells(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return stockbaFetch(`/sells${qs}`);
}

export async function createStockBASell(orderData: {
    contact_id?: number;
    location_id?: number;
    items: { product_id: number; quantity: number; unit_price: number }[];
    payment_method?: string;
    notes?: string;
    total: number;
}) {
    // StockBA no tiene endpoint POST /sells en la API pública aún,
    // pero dejamos la función preparada para cuando se agregue
    return stockbaFetch('/sells', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}

// ─── Summary ────────────────────────────────────────────────

export async function getStockBASummary(dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return stockbaFetch(`/summary?${params.toString()}`);
}

// ─── Status ─────────────────────────────────────────────────

export async function getStockBAStatus() {
    const res = await fetch(`${BASE_URL}/status`);
    return res.json();
}
