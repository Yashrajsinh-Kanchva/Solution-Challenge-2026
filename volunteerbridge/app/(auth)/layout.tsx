export default function Component({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="auth-shell">{children}</main>;
}
