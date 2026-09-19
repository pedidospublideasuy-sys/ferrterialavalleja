import postgres from 'postgres';

async function testConnection(url) {
    console.log(`Testing: ${url}`);
    const sql = postgres(url, { ssl: 'require', connect_timeout: 5 });
    try {
        const result = await sql`SELECT 1 as connected`;
        console.log(`SUCCESS! Connected to ${url}`);
        return true;
    } catch (e) {
        console.log(`FAILED: ${e.message}`);
        return false;
    } finally {
        await sql.end();
    }
}

async function main() {
    const regions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
        'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
        'ap-northeast-2', 'ap-south-1', 'sa-east-1', 'ca-central-1'
    ];
    const urls = [];
    for (const r of regions) {
        urls.push(`postgresql://postgres.aaotbycstcwcvbrkkqwr:VIcKcmHzLlxSk3X5@aws-0-${r}.pooler.supabase.com:6543/postgres`);
    }

    for (const url of urls) {
        await testConnection(url);
    }
}

main();
