import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { CompaniesPage } from "../features/companies/page";

export const companiesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/companies",
  component: CompaniesPage
});
