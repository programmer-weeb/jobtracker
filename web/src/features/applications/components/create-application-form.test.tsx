import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateApplicationForm } from "./create-application-form";

const companies = [
  { id: 2, name: "Acme", website: null, location: "Remote" },
  { id: 3, name: "Beta", website: null, location: "Cairo" }
];

const tags = [
  { id: 5, name: "urgent", color: "#ff0000" },
  { id: 6, name: "remote", color: "#2563eb" }
];

afterEach(() => {
  cleanup();
});

describe("CreateApplicationForm", () => {
  it("submits the selected application fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateApplicationForm
        companies={companies}
        tags={tags}
        isSaving={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("Application title"), { target: { value: "Rails Engineer" } });
    fireEvent.change(screen.getByLabelText("Application company"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Application status"), { target: { value: "applied" } });
    fireEvent.change(screen.getByLabelText("Application source"), { target: { value: "LinkedIn" } });
    fireEvent.change(screen.getByLabelText("Application location"), { target: { value: "Cairo" } });
    fireEvent.click(screen.getByLabelText("Remote"));
    fireEvent.click(screen.getByRole("button", { name: "urgent" }));
    fireEvent.click(screen.getByRole("button", { name: /create application/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      title: "Rails Engineer",
      company_id: 3,
      status: "applied",
      source: "LinkedIn",
      remote: false,
      location: "Cairo",
      tag_ids: [5]
    }));
  });

  it("shows validation errors before submitting", () => {
    const onSubmit = vi.fn();
    render(
      <CreateApplicationForm
        companies={companies}
        tags={tags}
        isSaving={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /create application/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a company and supports cancel", () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    render(
      <CreateApplicationForm
        companies={[]}
        tags={[]}
        isSaving={false}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("No tags available.")).toBeInTheDocument();
    expect(screen.getByText("Add a company before creating an application.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Application title"), { target: { value: "Frontend Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
