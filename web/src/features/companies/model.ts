export interface Company {
  id: number;
  user_id: number;
  name: string;
  website: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompaniesResponse {
  data: Company[];
}

export interface CompanyResponse {
  data: Company;
}

export interface UpsertCompanyPayload {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
}
