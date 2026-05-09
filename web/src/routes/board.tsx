import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { BoardPage } from "../features/board/page";

export const boardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/board",
  component: BoardPage
});
