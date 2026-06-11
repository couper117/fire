import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

interface DynamicFormProps {
    schema: {
        properties: Record<string, { enum?: string[], format?: string, example?: string }>;
        required?: string[];
    };
    onSubmit: (data: any) => void;
}

export const DynamicForm = ({ schema, onSubmit }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key} style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block' }}>{key}</label>
          {prop.enum ? (
            <select name={key} onChange={handleChange} required={schema.required?.includes(key)}>
              {prop.enum.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              type={prop.format === 'password' ? 'password' : 'text'}
              name={key}
              placeholder={prop.example}
              onChange={handleChange}
              required={schema.required?.includes(key)}
            />
          )}
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
};
