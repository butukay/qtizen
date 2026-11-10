import { act, fireEvent, render, screen } from "@testing-library/preact";
import { expect, test } from "vitest";

import { createCardEnvironment } from "../test/createCardEnvironment";

import { AppCard } from "./AppCard";

const app = { id: "demo", name: "Demo app", icon: "/icon.png" };

test("the Default card keeps the app name, focus and activation without banner artwork", () => {
  const env = createCardEnvironment(`app:${app.id}`, { artwork: ["/banner.png"], logoPath: "M0 0" });
  render(<AppCard env={env} app={app} active />);
  const card = screen.getByRole("button", { name: app.name });
  expect(card.querySelector("[data-app-artwork]")).toBeNull();
  expect(card.getAttribute("data-focused")).toBe("true");
  fireEvent.click(card);
  expect(env.activate).toHaveBeenCalledExactlyOnceWith(`app:${app.id}`);
});

test("app updates retain the card node while names and remote focus update", async () => {
  const env = createCardEnvironment(`app:${app.id}`);
  const { rerender } = render(<AppCard env={env} app={app} active />);
  const card = screen.getByRole("button", { name: app.name });
  await act(() => env.state.set({ ...env.state.getSnapshot(), selected: "gear" }));
  expect(card.hasAttribute("data-focused")).toBe(false);
  rerender(<AppCard env={env} app={{ ...app, name: "Updated app" }} active />);
  expect(screen.getByRole("button", { name: "Updated app" })).toBe(card);
});
