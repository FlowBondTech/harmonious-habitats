export default function SimpleApp() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Harmonious Habitats</h1>
      <p>✅ React is working!</p>
      <p>If you can see this, the app is loading successfully.</p>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Actions:</h2>
        <button onClick={() => window.location.href = '/activities'}>
          Go to Activities
        </button>
        {' '}
        <button onClick={() => alert('App is working!')}>
          Test Alert
        </button>
      </div>
    </div>
  );
}