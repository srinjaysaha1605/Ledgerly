/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AWS_S3_BUCKET?: string;
  readonly VITE_AWS_REGION?: string;
  readonly VITE_AWS_S3_PRESIGNED_ENDPOINT?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
