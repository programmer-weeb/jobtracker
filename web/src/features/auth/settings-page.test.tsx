import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./settings-page";

vi.mock("./context", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Demo Hunter", email: "demo@example.com" },
    isAuthenticated: true
  })
}));

describe("SettingsPage", () => {
  it("renders account and demo deployment information", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Demo Hunter")).toBeInTheDocument();
    expect(screen.getAllByText("demo@example.com")).toHaveLength(2);
    expect(screen.getAllByText("password123")).toHaveLength(2);
  });
});
