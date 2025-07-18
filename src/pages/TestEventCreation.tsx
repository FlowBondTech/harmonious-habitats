import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';

const TestEventCreation = () => {
  const { user } = useAuthContext();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const testSimpleInsert = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setError(null);
    setResult(null);

    const testData = {
      organizer_id: user.id,
      title: 'Test Event',
      category: 'wellness',
      date: '2025-02-01',
      start_time: '10:00',
      end_time: '11:00',
      location_name: 'Test Location',
      status: 'published',
      visibility: 'public'
    };

    console.log('Testing with data:', testData);

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([testData])
        .select();

      console.log('Response:', { data, error });

      if (error) {
        setError(error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Caught error:', err);
      setError(err);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setResult({ session });
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setResult({ user });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Event Creation</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Check Auth Session
        </button>
        
        <button
          onClick={checkUser}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Check User
        </button>
        
        <button
          onClick={testSimpleInsert}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Simple Insert
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold">Error:</h3>
          <pre className="text-sm">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestEventCreation;