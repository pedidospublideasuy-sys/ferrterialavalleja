import postgres from 'postgres';

const sql = postgres('postgresql://postgres.aaotbycstcwcvbrkkqwr:VIcKcmHzLlxSk3X5@aws-0-us-west-2.pooler.supabase.com:6543/postgres', { ssl: 'require' });

async function main() {
    console.log("Starting database initialization...");

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS config (
                key VARCHAR UNIQUE,
                value TEXT
            );
        `;
        console.log("Table config created.");

        await sql`
            CREATE TABLE IF NOT EXISTS site_config (
                key VARCHAR UNIQUE,
                value JSONB,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table site_config created.");

        await sql`
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                email VARCHAR UNIQUE,
                phone VARCHAR,
                address VARCHAR,
                client_code VARCHAR,
                pin_code VARCHAR,
                password_hash VARCHAR,
                role VARCHAR DEFAULT 'client',
                status VARCHAR DEFAULT 'active',
                avatar_url VARCHAR,
                advisor VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table clients created.");

        await sql`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                slug VARCHAR UNIQUE NOT NULL,
                name VARCHAR,
                description TEXT,
                icon VARCHAR,
                color VARCHAR,
                sort_order INT,
                active BOOLEAN DEFAULT TRUE
            );
        `;
        console.log("Table services created.");

        await sql`
            CREATE TABLE IF NOT EXISTS service_products (
                id SERIAL PRIMARY KEY,
                service_id INT REFERENCES services(id) ON DELETE CASCADE,
                service_slug VARCHAR,
                name VARCHAR,
                description TEXT,
                price NUMERIC,
                unit VARCHAR,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT,
                image_url VARCHAR,
                price_visible BOOLEAN DEFAULT TRUE,
                calculator_enabled BOOLEAN DEFAULT FALSE,
                price_per_m2 NUMERIC,
                details JSONB
            );
        `;
        console.log("Table service_products created.");

        await sql`
            CREATE TABLE IF NOT EXISTS variants (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                description TEXT,
                price_type VARCHAR,
                price NUMERIC,
                price_percent NUMERIC,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table variants created.");

        await sql`
            CREATE TABLE IF NOT EXISTS product_variants (
                product_id INT REFERENCES service_products(id) ON DELETE CASCADE,
                variant_id INT REFERENCES variants(id) ON DELETE CASCADE,
                PRIMARY KEY (product_id, variant_id)
            );
        `;
        console.log("Table product_variants created.");

        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number VARCHAR,
                client_id INT,
                service_slug VARCHAR,
                product_name VARCHAR,
                title VARCHAR,
                description TEXT,
                status VARCHAR,
                total NUMERIC,
                currency VARCHAR DEFAULT 'USD',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table orders created.");

        await sql`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INT REFERENCES orders(id) ON DELETE CASCADE,
                product_name VARCHAR,
                quantity INT,
                unit_price NUMERIC,
                subtotal NUMERIC
            );
        `;
        console.log("Table order_items created.");

        await sql`
            CREATE TABLE IF NOT EXISTS order_files (
                id SERIAL PRIMARY KEY,
                order_id INT REFERENCES orders(id) ON DELETE CASCADE,
                file_name VARCHAR,
                file_url VARCHAR,
                file_type VARCHAR,
                uploaded_by VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table order_files created.");

        await sql`
            CREATE TABLE IF NOT EXISTS payment_gateways (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                type VARCHAR,
                description TEXT,
                config JSONB,
                active BOOLEAN DEFAULT FALSE,
                test_mode BOOLEAN DEFAULT FALSE,
                sort_order INT
            );
        `;
        console.log("Table payment_gateways created.");

        await sql`
            CREATE TABLE IF NOT EXISTS home_sections (
                id SERIAL PRIMARY KEY,
                type VARCHAR,
                title VARCHAR,
                subtitle VARCHAR,
                content TEXT,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table home_sections created.");

        await sql`
            CREATE TABLE IF NOT EXISTS process_steps (
                id SERIAL PRIMARY KEY,
                icon VARCHAR,
                label VARCHAR,
                description TEXT,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table process_steps created.");

        await sql`
            CREATE TABLE IF NOT EXISTS shipping_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                description TEXT,
                type VARCHAR,
                price NUMERIC,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table shipping_types created.");

        await sql`
            CREATE TABLE IF NOT EXISTS shipping_agencies (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                description TEXT,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table shipping_agencies created.");

        await sql`
            CREATE TABLE IF NOT EXISTS retiros (
                id SERIAL PRIMARY KEY,
                name VARCHAR,
                address VARCHAR,
                schedules VARCHAR,
                active BOOLEAN DEFAULT TRUE,
                sort_order INT
            );
        `;
        console.log("Table retiros created.");

        await sql`
            CREATE TABLE IF NOT EXISTS pages (
                id VARCHAR PRIMARY KEY,
                title VARCHAR,
                slug VARCHAR UNIQUE,
                content TEXT,
                active BOOLEAN DEFAULT TRUE,
                show_in_menu BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table pages created.");
        
        await sql`
            CREATE TABLE IF NOT EXISTS pending_payments (
                id SERIAL PRIMARY KEY,
                client_id VARCHAR,
                order_id VARCHAR,
                amount NUMERIC,
                currency VARCHAR,
                due_date TIMESTAMP,
                status VARCHAR,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log("Table pending_payments created.");

        console.log("Database initialized successfully!");
    } catch (e) {
        console.error("Error initializing database:", e);
    } finally {
        await sql.end();
    }
}

main();
