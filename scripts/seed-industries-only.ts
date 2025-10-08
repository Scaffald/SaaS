#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const industries = [
  { slug: 'construction', name: 'Construction', description: 'Residential and commercial building trades' },
  { slug: 'manufacturing', name: 'Manufacturing', description: 'Industrial fabrication and assembly' },
  { slug: 'transportation', name: 'Transportation', description: 'Transportation, warehousing, and supply chain' },
  { slug: 'energy', name: 'Energy', description: 'Utilities, renewables, and field services' }
];

async function main() {
  console.log("🌱 Seeding industries...\n");
  
  for (const industry of industries) {
    const { error } = await supabase
      .from('industries')
      .upsert(industry, { onConflict: 'slug' });
    
    if (error) {
      console.error(`❌ Error inserting ${industry.name}:`, error);
    } else {
      console.log(`✅ ${industry.name}`);
    }
  }
  
  // Verify
  const { data, error } = await supabase
    .from('industries')
    .select('*');
  
  if (error) {
    console.error("\n❌ Error checking industries:", error);
  } else {
    console.log(`\n✅ Total industries: ${data?.length || 0}`);
    console.log("Industries:", data?.map(i => i.name).join(", "));
  }
}

main().catch(console.error);
