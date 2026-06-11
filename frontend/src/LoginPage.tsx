import { useEffect, useState } from 'react';
import { fetchOpenApi } from './openapi';
import { DynamicForm } from './DynamicForm';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const [schema, setSchema] = useState<any>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpenApi('users').then(data => {
      setSchema(data.components.schemas.LoginRequest);
    });
  }, []);

  const handleLogin = async (data: any) => {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {schema ? <DynamicForm schema={schema} onSubmit={handleLogin} /> : <p>Loading form...</p>}
    </div>
  );
};
