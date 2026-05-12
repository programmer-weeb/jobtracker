import { createLazyRoute } from "@tanstack/react-router";
import { CompaniesPage } from "../features/companies/page";

export const Route = createLazyRoute("/authenticated/companies")({
  component: CompaniesPage
});
