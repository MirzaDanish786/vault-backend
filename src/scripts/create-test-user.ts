// scripts/create-test-user.ts
import { supabaseServer } from '@/config/supabase/server-client';
import { prisma } from '@/lib/prisma/client';
import { env } from '@/config/env';

async function createTestUser() {
  console.log('🧪 Creating proper test user...\n');
  
  try {
    // 1. Create user in Supabase Auth
    console.log('1. Creating Supabase Auth user...');
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: 'test@example.com',
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'USER'
      }
    });
    
    if (authError) {
      console.error('❌ Supabase Auth error:', authError.message);
      return;
    }
    
    const supabaseUserId = authData.user.id;
    console.log(`✅ Supabase user created: ${supabaseUserId}`);
    
    // 2. Create user in your custom table
    console.log('\n2. Creating custom user in your database...');
    const customUser = await prisma.user.create({
      data: {
        id: supabaseUserId, // SAME UUID!
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password: 'TestPassword123!', // Add password field
        profile: {
          create: {} // Auto-create profile
        }
      },
      include: { profile: true }
    });
    
    console.log(`✅ Custom user created with matching ID: ${customUser.id}`);
    
    // 3. Verify the relationship
    console.log('\n3. Verifying both users exist...');
    
    const [supabaseUsers, yourUsers] = await Promise.all([
      supabaseServer.auth.admin.listUsers(),
      prisma.user.findMany()
    ]);
    
    console.log(`📊 Supabase users: ${supabaseUsers.data?.users.length || 0}`);
    console.log(`📊 Your custom users: ${yourUsers.length}`);
    
    console.log('\n🎉 Test user created successfully!');
    console.log(`   Run /api/test again to see both users.`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

createTestUser();