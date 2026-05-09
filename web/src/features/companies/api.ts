import { http } from "../../lib/http";
import type { CompaniesResponse, CompanyResponse, UpsertCompanyPayload } from "./model";

export async function fetchCompanies() {
  const { data } = await http.get<CompaniesResponse>("/companies");
  return data;
}

export async function createCompany(company: UpsertCompanyPayload) {
  const { data } = await http.post<CompanyResponse>("/companies", { company });
  return data;
}

export async function updateCompany(id: number, company: UpsertCompanyPayload) {
  const { data } = await http.patch<CompanyResponse>(`/companies/${id}`, { company });
  return data;
}

export async function deleteCompany(id: number) {
  await http.delete(`/companies/${id}`);
}
