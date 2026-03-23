import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/layout/AppShell";

describe("AppShell", () => {
  it("does not render the slow-read card", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>stub page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("慢慢读")).not.toBeInTheDocument();
  });

  it.each([
    ["/", "首页", "今天想读哪一句"],
    ["/categories", "分类", "按主题和作者慢慢找"],
    ["/favorites", "收藏", "把想反复读的句子留在这里"],
    ["/settings", "设置", "管理账号与偏好"],
  ])("renders the shared header for %s", (path, title, description) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>home page</div>} />
            <Route path="categories" element={<div>categories page</div>} />
            <Route path="favorites" element={<div>favorites page</div>} />
            <Route path="settings" element={<div>settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("removes shared main padding on the immersive home route", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>home page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const main = container.querySelector("main");

    expect(main?.className).toContain("flex");
    expect(main?.className).toContain("overflow-hidden");
    expect(main?.className).toContain("pb-[4.75rem]");
    expect(main?.className).not.toContain("px-6");
    expect(main?.className).not.toContain("pb-22");
  });

  it("hides the shared header on category detail page", () => {
    render(
      <MemoryRouter initialEntries={["/categories/a"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="categories/:categoryId" element={<div>category detail page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "分类" })).not.toBeInTheDocument();
  });

  it("hides the shared header on person detail page", () => {
    render(
      <MemoryRouter initialEntries={["/categories/author/person-1"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="categories/:role/:personId" element={<div>person detail page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "分类" })).not.toBeInTheDocument();
  });

  it("hides the shared header on favorite folder detail page", () => {
    render(
      <MemoryRouter initialEntries={["/favorites/folder-1"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="favorites/:folderId" element={<div>favorite folder page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "收藏" })).not.toBeInTheDocument();
  });
});
