import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess } from "@/lib/api-response";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET = "shop-images";

/**
 * Uploads a shop product photo (camera roll or file picker) to Supabase
 * Storage and returns its public URL — the same `MenuItem.imageUrl` field
 * that previously only accepted a pasted link, so no schema change needed.
 * Manager-only, matching every other Shop write. The bucket is created
 * lazily on first use (public, since product photos are meant to be
 * visible on the public storefront/guest shop page) rather than requiring
 * a manual Supabase dashboard step before this route works.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return apiError("No file provided", 400);
  if (!ALLOWED_TYPES.includes(file.type)) return apiError("Please upload a JPG, PNG, WEBP, or GIF image", 400);
  if (file.size > MAX_BYTES) return apiError("Image must be under 5MB", 400);

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.workspaceId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError && /bucket not found/i.test(uploadError.message)) {
    await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES });
    ({ error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    }));
  }

  if (uploadError) return apiError("Upload failed. Try again.", 500);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return apiSuccess({ url: data.publicUrl });
}
