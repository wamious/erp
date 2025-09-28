import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://epygmqmiialqolpfnymu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweWdtcW1paWFscW9scGZueW11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU4MjE2MCwiZXhwIjoyMDY1MTU4MTYwfQ.edQfENT2k7YzLrIqamdQJf74hcgpwpN18S1Riam5F3s" // ⚠️ only use server-side
);

async function seedAdmin() {
    const { data, error } = await supabase.auth.admin.createUser({
        email: 'contact.wamious@gmail.com',
        password: 'admin@123',
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });
    console.log(data, error);
};

seedAdmin();
