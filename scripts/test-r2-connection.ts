/**
 * Cloudflare R2 Connection Test Script
 * Verifies R2 credentials and bucket access
 * 
 * Usage: pnpm test:r2
 * 
 * Prerequisites:
 * - R2_ACCOUNT_ID set in .env.local
 * - R2_ACCESS_KEY_ID set in .env.local
 * - R2_SECRET_ACCESS_KEY set in .env.local
 * - R2_BUCKET_NAME set in .env.local
 * 
 * Reference: STORAGE_AND_UPLOAD_ANALYSIS.md lines 122-172
 */

import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function testR2Connection() {
    console.log('🧪 Testing Cloudflare R2 Connection...\n');

    // Check environment variables
    console.log('📋 Checking environment variables...');
    const requiredEnvVars = {
        'R2_ACCOUNT_ID': process.env.R2_ACCOUNT_ID,
        'R2_ACCESS_KEY_ID': process.env.R2_ACCESS_KEY_ID,
        'R2_SECRET_ACCESS_KEY': process.env.R2_SECRET_ACCESS_KEY,
        'R2_BUCKET_NAME': process.env.R2_BUCKET_NAME,
        'R2_PUBLIC_URL': process.env.R2_PUBLIC_URL,
    };

    const missing = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error('❌ Missing environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Add them to .env.local (get from Cloudflare R2 Dashboard)');
        process.exit(1);
    }

    console.log('✅ All environment variables present\n');

    // Initialize R2 client
    console.log('🔧 Initializing R2 client...');
    const R2 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
    });

    console.log(`✅ Client initialized for account: ${process.env.R2_ACCOUNT_ID}\n`);

    // Test 1: Bucket Access
    console.log('🪣 Testing bucket access...');
    try {
        const headBucketCommand = new HeadBucketCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
        });

        await R2.send(headBucketCommand);
        console.log(`✅ Bucket "${process.env.R2_BUCKET_NAME}" is accessible\n`);
    } catch (error: any) {
        if (error.name === 'NotFound') {
            console.error(`❌ Bucket "${process.env.R2_BUCKET_NAME}" does not exist`);
            console.error('💡 Create it in Cloudflare Dashboard → R2 → Create bucket');
        } else if (error.name === 'Forbidden') {
            console.error('❌ Access denied to bucket');
            console.error('💡 Check API token permissions in Cloudflare Dashboard');
        } else {
            console.error('❌ Bucket access failed:', error.message);
        }
        process.exit(1);
    }

    // Test 2: Generate Presigned URL
    console.log('🔐 Testing presigned URL generation...');
    try {
        const testKey = `test/${Date.now()}-test.txt`;

        const putCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: testKey,
            ContentType: 'text/plain',
        });

        const presignedUrl = await getSignedUrl(R2, putCommand, { expiresIn: 600 });

        console.log('✅ Presigned URL generated successfully');
        console.log(`   Key: ${testKey}`);
        console.log(`   URL: ${presignedUrl.substring(0, 100)}...`);
        console.log(`   Expires in: 10 minutes\n`);
    } catch (error: any) {
        console.error('❌ Presigned URL generation failed:', error.message);
        process.exit(1);
    }

    // Test 3: Public URL Configuration
    console.log('🌐 Checking public URL configuration...');
    const publicUrl = process.env.R2_PUBLIC_URL!;

    if (publicUrl.includes('r2.dev')) {
        console.log('✅ Using R2.dev public domain');
        console.log(`   ${publicUrl}`);
    } else {
        console.log('✅ Using custom domain');
        console.log(`   ${publicUrl}`);
        console.log('   Make sure custom domain is configured in R2 settings');
    }

    // Test 4: CORS Configuration Check
    console.log('\n⚠️  CORS Configuration (manual check required)');
    console.log('   R2 bucket must have CORS policy configured for:');
    console.log('   - AllowedOrigins: http://localhost:3000, https://q-app.tech');
    console.log('   - AllowedMethods: GET, PUT, POST, DELETE, HEAD');
    console.log('   - AllowedHeaders: *');
    console.log('   - Reference: STORAGE_AND_UPLOAD_ANALYSIS.md lines 656-667');
    console.log('   - Configure in: Cloudflare Dashboard → R2 → Bucket Settings → CORS');

    console.log('\n✅ R2 connection test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify CORS configuration in R2 bucket settings');
    console.log('   2. Test file upload from frontend: http://localhost:3000/upload');
    console.log('   3. Check uploaded files appear in R2 dashboard');
}

// Run test
testR2Connection().catch((error) => {
    console.error('\n❌ Test failed with unexpected error:', error);
    process.exit(1);
});

