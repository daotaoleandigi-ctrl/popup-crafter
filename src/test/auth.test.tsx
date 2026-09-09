import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signIn: vi
    .fn()
    .mockResolvedValue({ error: new Error("Thông tin đăng nhập không đúng.") }),
  subscribe: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}));
vi.mock("@/lib/cloud", () => ({
  localMode: false,
  cloud: {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: mocks.subscribe,
      signInWithPassword: mocks.signIn,
    },
  },
}));
vi.mock("@/lib/repository", () => ({ clearRepository: vi.fn() }));
import AuthGate from "../components/AuthGate";
afterEach(() => cleanup());
describe("account gate", () => {
  it("hides private content until signed in and reports login failure", async () => {
    await act(async () => {
      render(
        <AuthGate>
          <div>Private library</div>
        </AuthGate>,
      );
    });
    expect(screen.queryByText("Private library")).toBeNull();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "test-password" },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /^Đăng nhập$/ }),
      );
    });
    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "test@example.test",
      password: "test-password",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Thông tin đăng nhập không đúng.",
    );
  });
});
