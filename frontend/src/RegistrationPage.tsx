import { useEffect, useState } from 'react';
import { fetchOpenApi } from './openapi';
import { DynamicForm } from './DynamicForm';
import { api } from './api';

export const RegistrationPage = () => {
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    fetchOpenApi('users').then(data => {
      setSchema(data.components.schemas.RegisterRequest);
    });
  }, []);

  const handleRegister = async (data: any) => {
    try {
      await api('/users/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert('Registered successfully!');
    } catch (err: any) {
      alert('Registration failed: ' + err.message);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      {schema ? <DynamicForm schema={schema} onSubmit={handleRegister} /> : <p>Loading form...</p>}
    </div>
  );
};
