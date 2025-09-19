export interface AuthProvider {
  id: number;
  key: string; // e.g., 'google', 'university_saml'
  name: string; // display name
  type: "oauth2" | "saml";
  enabled: boolean;
  config?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}
