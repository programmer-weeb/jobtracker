import { createLazyRoute } from "@tanstack/react-router";
import { BoardPage } from "../features/board/page";

export const Route = createLazyRoute("/authenticated/board")({
  component: BoardPage
});
