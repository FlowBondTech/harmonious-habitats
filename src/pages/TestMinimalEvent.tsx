import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';

const TestMinimalEvent = () => {
  const { user } = useAuthContext();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const testMinimalInsert = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    // Absolute minimum required fields based on the migration
    const minimalData = {
      organizer_id: user.id,
      title: 'Test Event Minimal',
      category: 'wellness',
      date: '2025-02-01',
      start_time: '10:00',
      end_time: '11:00'
    };

    console.log('Testing minimal insert:', minimalData);

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([minimalData])
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

  const checkTableSchema = async () => {
    try {
      // Get table columns info using a raw SQL query
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'events' });

      if (error) {
        // If the function doesn't exist, try a different approach
        console.log('RPC failed, trying direct query');
        
        // Try to get columns by querying with limit 0
        const { data: emptyData, error: queryError } = await supabase
          .from('events')
          .select('*')
          .limit(0);
          
        if (queryError) {
          setError(queryError);
        } else {
          setResult({ 
            message: 'Table exists but cannot determine columns',
            hint: 'Try the minimal insert to see which columns are missing'
          });
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Minimal Event Creation</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkTableSchema}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Check Table Schema
        </button>
        
        <button
          onClick={testMinimalInsert}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Minimal Insert
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

export default TestMinimalEvent;