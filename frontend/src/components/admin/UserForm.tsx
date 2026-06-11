import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Select } from '../shared';
import { useState } from 'react';

const createUserSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['Admin', 'Inspector', 'User'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserFormProps {
  user?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const UserForm = ({ user, onSubmit, onCancel }: UserFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: user || {},
  });

  const onSubmitForm = async (data: CreateUserFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Input
        label="First Name"
        placeholder="John"
        {...register('firstName')}
        error={errors.firstName?.message}
      />

      <Input
        label="Last Name"
        placeholder="Doe"
        {...register('lastName')}
        error={errors.lastName?.message}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        {...register('email')}
        error={errors.email?.message}
      />

      {!user && (
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />
      )}

      <Select
        label="Role"
        options={[
          { value: 'User', label: 'User' },
          { value: 'Inspector', label: 'Inspector' },
          { value: 'Admin', label: 'Admin' },
        ]}
        {...register('role')}
        error={errors.role?.message}
      />

      <div className="flex gap-3 justify-end pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};
