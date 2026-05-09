export const applicationStatuses = ["wishlist", "applied", "interview", "offer", "rejected", "archived"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface CompanySummary {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
}

export interface TagSummary {
  id: number;
  name: string;
  color: string | null;
}

export interface Application {
  id: number;
  user_id: number;
  company_id: number;
  title: string;
  status: ApplicationStatus;
  source: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  remote: boolean;
  location: string | null;
  url: string | null;
  applied_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  company: CompanySummary;
  tags: TagSummary[];
}

export interface ApplicationsResponse {
  data: Application[];
}
