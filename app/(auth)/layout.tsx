const GYM_BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{
        backgroundImage: `url("${GYM_BACKGROUND_IMAGE}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-950/85 to-emerald-950/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
