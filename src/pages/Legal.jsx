export function PrivacyPolicy() {
  return (
    <div style={{ padding: '48px 32px', maxWidth: '700px', margin: '0 auto', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.8, fontSize: '14px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', marginBottom: '24px', color: 'var(--cream-200)' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '12px' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>What we collect</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>EVOLVE stores the data you enter directly: tasks, habits, journal entries, focus sessions, health logs (including optional period and illness tracking), mood check-ins, and chat messages with the AI coach. We do not collect data beyond what you actively enter into the app.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>How it's stored</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>All data is stored in a Supabase database with row-level security — meaning your data is only accessible to your own account, enforced at the database level. Messages sent to the AI coach are processed by Groq's API to generate responses and are not used to train models.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Health data</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>Health-related features (period tracking, illness logs, nutrition, sleep) are entirely optional and only visible to you. This data is never shared, sold, or used for advertising.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Your rights</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>You can request deletion of your account and all associated data at any time by contacting the app administrator. Deleting your account permanently removes all stored data.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Contact</h2>
      <p style={{ color: 'var(--muted)' }}>Questions about this policy can be directed to the app owner.</p>
    </div>
  )
}

export function TermsOfService() {
  return (
    <div style={{ padding: '48px 32px', maxWidth: '700px', margin: '0 auto', color: 'var(--cream-200)', fontFamily: 'var(--font-sans)', lineHeight: 1.8, fontSize: '14px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontStyle: 'italic', marginBottom: '24px', color: 'var(--cream-200)' }}>Terms of Service</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '12px' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Using EVOLVE</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>EVOLVE is a personal productivity and wellbeing tool provided as-is. It is not a medical device and does not provide medical, psychological, or financial advice. The AI Life Coach feature offers general guidance based on patterns in your self-reported data — it is not a substitute for professional support.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Account responsibility</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>You are responsible for keeping your login credentials secure. EVOLVE is not liable for unauthorized access resulting from shared or compromised credentials.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Availability</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>EVOLVE is provided without uptime guarantees. Features may change or be discontinued at any time.</p>

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontStyle: 'italic', marginTop: '28px', marginBottom: '10px', color: 'var(--gold-300)' }}>Limitation of liability</h2>
      <p style={{ color: 'var(--muted)' }}>EVOLVE and its creators are not liable for any decisions made based on app content, including AI-generated suggestions.</p>
    </div>
  )
}