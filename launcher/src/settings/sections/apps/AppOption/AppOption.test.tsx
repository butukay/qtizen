import { fireEvent, render, screen } from "@testing-library/preact";
import { expect, test, vi } from "vitest";

import type { AppPresentation } from "../../../../contracts/launcher";
import { createNavigation } from "../../../../shared/navigation/createNavigation";

import { AppOption } from "./AppOption";

const navigation = createNavigation(() => undefined);
vi.mock("../../../hooks/useSettingsEnvironment", () => ({
  useSettingsEnvironment: () => ({ navigation }),
}));
const app = { id: "demo", name: "Demo app" };
const describeApp = (): AppPresentation => ({
  artwork: ["/banner.png"],
  background: "black",
  label: null,
  largeLogo: false,
  logoColour: "white",
  logoPath: "M2 2h20v20H2Z",
  textColour: "white",
  title: app.name,
  useAppIcon: false,
});

test("the application row shows its name and compact logo without requesting banner artwork", () => {
  render(<AppOption app={app} describeApp={describeApp} onSelect={vi.fn()} selected={false} active />);
  const button = screen.getByRole("button", { name: app.name });
  expect(button.textContent).toContain(app.name);
  expect(button.querySelector("[data-app-fallback] svg")).not.toBeNull();
  expect(button.querySelector("img")).toBeNull();
});

test("the row keeps its node when selection changes and disables unavailable sources", () => {
  const onSelect = vi.fn();
  const props = { app, describeApp, onSelect, active: false };
  const { rerender } = render(<AppOption {...props} selected />);
  const button = screen.getByRole("button", { name: app.name, pressed: true });
  expect(button.querySelector("[data-selection-indicator] .lucide-check")).not.toBeNull();
  fireEvent.click(button);
  expect(onSelect).toHaveBeenCalledTimes(1);
  rerender(<AppOption {...props} selected={false} disabled />);
  expect(screen.getByRole("button", { name: app.name, pressed: false })).toBe(button);
  expect(button.querySelector("[data-selection-indicator]")).toBeNull();
  fireEvent.click(button);
  expect(onSelect).toHaveBeenCalledTimes(1);
});
