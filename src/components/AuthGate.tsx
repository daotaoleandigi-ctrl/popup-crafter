import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { Gift, LogOut } from "lucide-react";
import { cloud, localMode } from "@/lib/cloud";
import { clearRepository } from "@/lib/repository";

export default function AuthGate({ children }: { children: ReactNode }) {
  const userId = useRef<string | undefined>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!cloud);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset" | "recovery">(
    "login",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!cloud) return;
    let alive = true;
    cloud.auth.getSession().then(({ data, error }) => {
      if (alive) {
        setSession(data.session);
        setLoading(false);
        if (error) setMessage(error.message);
      }
    });
    const {
      data: { subscription },
    } = cloud.auth.onAuthStateChange((event, value) => {
      if (userId.current !== value?.user.id) {
        clearRepository();
        userId.current = value?.user.id;
      }
      setSession(value);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!cloud) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await cloud.auth.resetPasswordForEmail(email, {
          redirectTo: new URL(
            import.meta.env.BASE_URL,
            window.location.origin,
          ).href,
        });
        if (error) throw error;
        setMessage(
          "Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.",
        );
      } else if (mode === "recovery") {
        const { error } = await cloud.auth.updateUser({ password });
        if (error) throw error;
        setPassword("");
        setMode("login");
      } else if (mode === "register") {
        const { data, error } = await cloud.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: new URL(
              import.meta.env.BASE_URL,
              window.location.origin,
            ).href,
          },
        });
        if (error) throw error;
        setMessage(
          data.session
            ? "Tạo tài khoản thành công."
            : "Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
        );
        setPassword("");
      } else {
        const { error } = await cloud.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setPassword("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể kết nối. Thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (localMode)
    return (
      <>
        <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-950">
          Bản thử trên máy — dữ liệu đang lưu trong trình duyệt. Chưa kết nối
          tài khoản và database.
        </div>
        {children}
      </>
    );
  if (!cloud)
    return (
      <main className="mx-auto max-w-lg p-10">
        <h1 className="text-2xl font-bold">Chưa kết nối dịch vụ lưu trữ</h1>
        <p className="mt-4">
          Quản trị viên cần cấu hình Supabase trước khi mở đăng ký. Dữ liệu sẽ
          không được lưu tạm vào trình duyệt trên bản xuất bản.
        </p>
      </main>
    );
  if (loading)
    return (
      <p role="status" className="p-10 text-center">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  if (session && mode !== "recovery")
    return (
      <div key={session.user.id}>
        <div className="flex flex-wrap justify-between gap-2 border-b bg-card px-4 py-2 text-xs">
          <span>{session.user.email} · Lưu trên cloud</span>
          <button
            disabled={busy}
            className="flex items-center gap-1"
            onClick={async () => {
              setBusy(true);
              const { error } = await cloud.auth.signOut();
              setBusy(false);
              if (error) setMessage(error.message);
            }}
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
          {message && <p role="alert">{message}</p>}
        </div>
        {children}
      </div>
    );
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-3xl border bg-card shadow-sm md:grid-cols-2">
        <section className="bg-secondary p-8">
          <Gift className="mb-8 text-primary" size={40} />
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Popup Crafter
          </p>
          <h1 className="mt-4 text-3xl font-extrabold">
            Thẻ quà của bạn.
            <br />Ở mọi nơi.
          </h1>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Lưu thiết kế theo tài khoản. Chỉnh sửa bản nháp và xuất bản khi đã
            sẵn sàng.
          </p>
        </section>
        <form onSubmit={submit} className="space-y-4 p-8">
          <h2 className="text-xl font-bold">
            {mode === "register"
              ? "Tạo tài khoản"
              : mode === "reset"
                ? "Quên mật khẩu"
                : mode === "recovery"
                  ? "Đặt mật khẩu mới"
                  : "Đăng nhập"}
          </h2>
          {mode !== "recovery" && (
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
          )}
          {mode !== "reset" && (
            <label className="block text-sm">
              Mật khẩu
              <input
                required
                minLength={8}
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
          )}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? "Đang xử lý…"
              : mode === "reset"
                ? "Gửi liên kết"
                : mode === "register"
                  ? "Tạo tài khoản"
                  : mode === "recovery"
                    ? "Lưu mật khẩu"
                    : "Đăng nhập"}
          </button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          {mode !== "recovery" && (
            <div className="flex flex-wrap gap-4 text-xs text-primary">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setMessage("");
                }}
              >
                {mode === "login" ? "Tạo tài khoản" : "Về đăng nhập"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setMessage("");
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
