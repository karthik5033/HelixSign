process.env.MASTER_KEY = '11'.repeat(32);
process.env.USE_STUBS = 'true';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_KEY;
