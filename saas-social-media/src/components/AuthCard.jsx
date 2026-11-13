import Logo from "./Logo";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <div className="card p-8 shadow-sm">
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
