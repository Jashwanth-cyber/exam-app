import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--text)', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>🔍</div>
      <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 48, fontWeight: 700, margin: '0 0 12px', color: 'var(--accent)' }}>404</h1>
      <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 32, maxWidth: 400 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" style={{
        textDecoration: 'none', padding: '12px 28px', borderRadius: 8,
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        color: '#fff', fontWeight: 600, fontSize: 15,
      }}>
        Go Home
      </Link>
    </div>
  );
}
