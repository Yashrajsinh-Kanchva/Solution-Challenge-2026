import Link from "next/link";

export default function Page() {
  return (
    <main className="landing-page">
      <div className="landing-card">
        <h1>VolunteerBridge</h1>
        <p>
          Smart resource allocation system connecting NGOs, citizens, and volunteers.
        </p>
        <div className="landing-links">
          <Link href="/login" prefetch={false}>Login</Link>
          <Link href="/admin/dashboard" prefetch={false}>Go to Admin Panel</Link>
        </div>
      </div>
    </main>
  );
}
