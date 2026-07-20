export const SAMPLE_SECRETS = {
  apiKey: "FAKE_API_KEY_VALUE_abcdefghijklmnopqrstuvwxyz012345",
  bearerToken: "FAKE_BEARER_TOKEN_abcdefghijklmnopqrstuvwxyz012345",
  jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjcmVhdHVyZS11c2VyIn0.signature-value",
  privateKey: [
    "-----BEGIN PRIVATE KEY-----",
    "VGhpcy1pcy1mYWtlLXByaXZhdGUta2V5LW1hdGVyaWFs",
    "-----END PRIVATE KEY-----",
  ].join("\n"),
  connectionString: "postgresql://creature:fake-db-password@db.example.test:5432/creature",
} as const;

export const sampleSecretValues = Object.values(SAMPLE_SECRETS);
