import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import path from 'path';

// Buscar la URL de la base de datos en el archivo .env.local
const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
    console.error("❌ No se encontró el archivo .env.local. Asegúrate de estar en la carpeta correcta.");
    process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=([^\n\r]+)/);

if (!dbUrlMatch) {
    console.error("❌ No se encontró la variable DATABASE_URL en tu archivo .env.local.");
    process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();
const sql = neon(dbUrl);

async function exportarBaseDeDatos() {
    console.log("⏳ Conectando a Neon y buscando tablas...");
    
    try {
        // Obtener la lista de todas las tablas en el esquema público
        const tables = await sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        
        const backup = {};
        let totalRows = 0;

        for (const row of tables) {
            const tableName = row.tablename;
            console.log(`📥 Descargando datos de la tabla: ${tableName}...`);
            
            const data = await sql.query(`SELECT * FROM "${tableName}"`);
            backup[tableName] = data;
            totalRows += data.length;
        }
        
        // Crear un archivo JSON con la fecha actual
        const date = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
        const filename = `backup_publideas_${date}.json`;
        
        fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
        
        console.log("\n✅ ============================================");
        console.log(`✅ ¡Respaldo completado exitosamente!`);
        console.log(`✅ Tablas exportadas: ${tables.length}`);
        console.log(`✅ Filas totales: ${totalRows}`);
        console.log(`✅ Archivo guardado como: ${filename}`);
        console.log("✅ ============================================\n");
        console.log("Guarda este archivo .json en un lugar seguro (en tu PC, Google Drive, o pendrive).");
        
    } catch (error) {
        console.error("\n❌ Ocurrió un error al hacer el respaldo:");
        console.error(error.message);
    }
}

exportarBaseDeDatos();
