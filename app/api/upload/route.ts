import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ACCOUNT_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const familyId = formData.get("familyId") as string | null;
    const reportId = formData.get("reportId") as string | null;

    if (!file || !familyId || !reportId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `families/${familyId}/photos/${reportId}.jpg`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    const publicUrl = `https://pub-1eaab78721dc47339ec96787aa99e46e.r2.dev/${key}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
