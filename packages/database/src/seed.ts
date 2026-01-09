/**
 * Database Seed Script
 * Creates test data for development
 * 
 * Usage: pnpm db:seed
 * 
 * IMPORTANT: This is for development only. Do not run in production!
 */

import { db, client, users, questions } from './index.js';

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        // Create test users
        console.log('👤 Creating test users...');

        const [testUser1, testUser2] = await db.insert(users).values([
            {
                id: 'test-user-1',
                email: 'john.doe@example.com',
                displayName: 'John Doe',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
                provider: 'google',
            },
            {
                id: 'test-user-2',
                email: 'jane.smith@example.com',
                displayName: 'Jane Smith',
                avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
                provider: 'google',
            },
        ]).returning();

        console.log(`✅ Created ${2} test users`);

        // Create test questions
        console.log('📄 Creating test questions...');

        await db.insert(questions).values([
            {
                title: 'CS101 Introduction to Programming - Final Exam 2024',
                courseCode: 'CS101',
                courseName: 'Introduction to Programming',
                level: 100,
                year: 2024,
                semester: 'First',
                hashtags: ['programming', 'java', 'final'],
                images: [
                    'https://picsum.photos/800/1000?random=1',
                    'https://picsum.photos/800/1000?random=2',
                ],
                authorId: testUser1.id,
            },
            {
                title: 'MTH201 Calculus II - Midterm 2024',
                courseCode: 'MTH201',
                courseName: 'Calculus II',
                level: 200,
                year: 2024,
                semester: 'Second',
                hashtags: ['calculus', 'math', 'midterm'],
                images: ['https://picsum.photos/800/1000?random=3'],
                authorId: testUser1.id,
            },
            {
                title: 'PHY102 Physics I - Final Exam 2023',
                courseCode: 'PHY102',
                courseName: 'Physics I',
                level: 100,
                year: 2023,
                semester: 'First',
                hashtags: ['physics', 'mechanics'],
                images: [
                    'https://picsum.photos/800/1000?random=4',
                    'https://picsum.photos/800/1000?random=5',
                    'https://picsum.photos/800/1000?random=6',
                ],
                authorId: testUser2.id,
            },
            {
                title: 'ENG301 Advanced English - Essay Questions 2024',
                courseCode: 'ENG301',
                courseName: 'Advanced English',
                level: 300,
                year: 2024,
                semester: 'LVS',
                hashtags: ['english', 'essay', 'literature'],
                images: ['https://picsum.photos/800/1000?random=7'],
                authorId: testUser2.id,
            },
        ]);

        console.log(`✅ Created ${4} test questions`);

        console.log('🎉 Seeding completed successfully!');
        console.log('\n📊 Test Data Summary:');
        console.log('  - Users: 2 (John Doe, Jane Smith)');
        console.log('  - Questions: 4 (various courses and levels)');
        console.log('\n💡 You can now:');
        console.log('  - View data in Supabase Dashboard → Table Editor');
        console.log('  - Or run: pnpm db:studio (opens Drizzle Studio)');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run seed if this file is executed directly
seed().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});

