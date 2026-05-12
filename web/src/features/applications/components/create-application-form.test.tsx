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
const onCreateCompany = vi.fn();

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
        onCreateCompany={onCreateCompany}
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
        onCreateCompany={onCreateCompany}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /create application/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports inline company creation and cancel", async () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const createCompany = vi.fn().mockResolvedValue({ id: 10, name: "NewCo", website: null, location: null });
    render(
      <CreateApplicationForm
        companies={[]}
        tags={[]}
        isSaving={false}
        onCancel={onCancel}
        onSubmit={onSubmit}
        onCreateCompany={createCompany}
      />
    );

    expect(screen.getByText("No tags available.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Application title"), { target: { value: "Frontend Engineer" } });
    fireEvent.change(screen.getByLabelText("New company name"), { target: { value: "NewCo" } });
    fireEvent.click(screen.getByRole("button", { name: /create application/i }));

    await waitFor(() => expect(createCompany).toHaveBeenCalledWith("NewCo"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ company_id: 10 })));

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("creates, selects, and deletes tags from the form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCreateTag = vi.fn().mockResolvedValue({ id: 99, name: "new tag", color: "#0066cc" });
    const onDeleteTag = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateApplicationForm
        companies={companies}
        tags={tags}
        isSaving={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        onCreateCompany={onCreateCompany}
      />
    );

    fireEvent.change(screen.getByLabelText("New tag name"), { target: { value: "new tag" } });
    fireEvent.click(screen.getByRole("button", { name: /add tag/i }));

    await waitFor(() => expect(onCreateTag).toHaveBeenCalledWith("new tag"));

    fireEvent.click(screen.getByLabelText("Delete tag urgent"));
    await waitFor(() => expect(onDeleteTag).toHaveBeenCalledWith(5));

    fireEvent.change(screen.getByLabelText("Application title"), { target: { value: "Rails Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: /create application/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      tag_ids: [99]
    })));
  });
});
