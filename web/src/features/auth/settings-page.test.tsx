import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "./settings-page";

describe("SettingsPage", () => {
  it("renders heading and placeholder text", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("User preferences and reminder options placeholder.")).toBeInTheDocument();
  });
});
