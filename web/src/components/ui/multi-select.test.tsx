import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect } from "./multi-select";

describe("MultiSelect", () => {
  it("opens, supports trigger/item keyboard navigation, selects, and closes on Escape", () => {
    const onChange = vi.fn();

    render(
      <MultiSelect
        ariaLabel="Filter by status"
        options={[
          { label: "applied", value: "applied" },
          { label: "interview", value: "interview" },
          { label: "offer", value: "offer" }
        ]}
        selected={[]}
        onChange={onChange}
        placeholder="All statuses"
      />
    );

    const trigger = screen.getByRole("button", { name: "Filter by status" });
    fireEvent.click(trigger);

    const menu = screen.getByRole("menu", { name: "Filter by status" });
    expect(menu).toBeInTheDocument();

    const applied = screen.getByRole("menuitemcheckbox", { name: "applied" });
    const interview = screen.getByRole("menuitemcheckbox", { name: "interview" });
    const offered = screen.getByRole("menuitemcheckbox", { name: "offer" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(applied).toHaveFocus();
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(offered).toHaveFocus();

    applied.focus();
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(interview).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(applied).toHaveFocus();

    fireEvent.click(applied);
    expect(onChange).toHaveBeenCalledWith(["applied"]);

    offered.focus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Filter by status" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
