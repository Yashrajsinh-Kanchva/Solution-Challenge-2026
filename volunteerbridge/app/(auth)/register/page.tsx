import Link from "next/link";

export default function Page() {
  return (
    <section className="auth-card">
      <h1>Register</h1>
      <p>Registration will be connected to Firebase Authentication in later steps.</p>
      <Link href="/login">Back to Login</Link>
    </section>
  );
}
