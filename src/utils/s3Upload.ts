/**
 * Cloud Storage & Amazon S3 Upload Utility
 * Handles profile image uploads, validation, S3 presigned URLs, and fallback data URLs.
 */

export interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  presignedEndpoint?: string;
}

export const getStoredS3Config = (): S3Config => {
  const saved = localStorage.getItem('cashquest_s3_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  const env = (import.meta as any).env || {};
  return {
    bucketName: env.VITE_AWS_S3_BUCKET || 'avatars',
    region: env.VITE_AWS_REGION || 'ap-southeast-1',
    presignedEndpoint: env.VITE_AWS_S3_PRESIGNED_ENDPOINT || '',
  };
};

export const saveS3Config = (config: S3Config) => {
  localStorage.setItem('cashquest_s3_config', JSON.stringify(config));
};

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  region: string;
  isSimulated: boolean;
}

/**
 * Uploads a file to Supabase Storage or Amazon S3 bucket (or fallback to persistent Data URL).
 */
export async function uploadImageToS3(
  file: File,
  folder: 'avatars' | 'receipts' = 'avatars',
  userId: string = 'player_hero'
): Promise<UploadResult> {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPEG, PNG, WEBP, or GIF.');
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeBytes) {
    throw new Error('File size exceeds 5MB limit. Please choose a smaller image.');
  }

  const config = getStoredS3Config();
  // Normalize bucket name (lowercase, no spaces)
  const rawBucket = config.bucketName || 'avatars';
  const bucketSlug = rawBucket.trim().toLowerCase().replace(/\s+/g, '-');
  
  const fileExt = file.name.split('.').pop() || 'png';
  const timestamp = Date.now();
  const filePath = `${userId}-${timestamp}.${fileExt}`;
  const s3Key = `${folder}/${filePath}`;

  // OPTION A: If a presigned endpoint is configured on backend
  if (config.presignedEndpoint && config.presignedEndpoint.includes('/api/')) {
    try {
      const presignedRes = await fetch(config.presignedEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: s3Key,
          contentType: file.type,
          bucket: bucketSlug,
          region: config.region,
        }),
      });

      if (presignedRes.ok) {
        const { uploadUrl, publicUrl } = await presignedRes.json();
        const s3UploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (s3UploadRes.ok) {
          return {
            url: publicUrl || `https://${bucketSlug}.s3.${config.region}.amazonaws.com/${s3Key}`,
            key: s3Key,
            bucket: bucketSlug,
            region: config.region,
            isSimulated: false,
          };
        }
      }
    } catch (err) {
      console.warn('Real S3 presigned upload encountered error, falling back to client storage:', err);
    }
  }

  // OPTION C: Fallback to reading file into instant Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        url: dataUrl,
        key: s3Key,
        bucket: bucketSlug,
        region: config.region,
        isSimulated: true,
      });
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };
    reader.readAsDataURL(file);
  });
}
