import { S3Client, s3 } from "bun";

type BunS3Client = S3Client;

export const blob: BunS3Client = new S3Client({
    accessKeyId: process.env.BLOB_USERNAME || "your-access-key",
    secretAccessKey: process.env.BLOB_PASSWORD || "your-secret-key",
    bucket: process.env.BLOB_BUCKET || "my-bucket",
    // sessionToken: "..."
    acl: "public-read",
    // endpoint: "https://s3.us-east-1.amazonaws.com",
    // endpoint: "https://<account-id>.r2.cloudflarestorage.com", // Cloudflare R2
    // endpoint: "https://<region>.digitaloceanspaces.com", // DigitalOcean Spaces
    endpoint: "http://localhost:9000", // MinIO
});
