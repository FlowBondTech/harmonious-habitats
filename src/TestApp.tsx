import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function TestApp() {
  const [status, setStatus] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      const messages: string[] = [];

      // Test 1: Supabase connection
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          messages.push(`❌ Database error: ${error.message}`);
        } else {
          messages.push('✅ Database connected');
        }
      } catch (err) {
        messages.push(`❌ Connection error: ${err}`);
      }

      // Test 2: Auth status
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          messages.push(`✅ Logged in as: ${session.user.email}`);
        } else {
          messages.push('ℹ️ Not logged in');
        }
      } catch (err) {
        messages.push(`❌ Auth error: ${err}`);
      }

      setStatus(messages);
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Harmonik Space - Test Page</h1>
      <div>
        <h2>Status:</h2>
        {status.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2>Next Steps:</h2>
        <p>If you see this page, React is working!</p>
        <p>Database connection: {status.some(s => s.includes('✅ Database')) ? 'Working' : 'Check status above'}</p>
      </div>
    </div>
  );
}