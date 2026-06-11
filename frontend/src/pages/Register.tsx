import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, LoadingSpinner } from '../components/shared';
import { api } from '../api';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';

const registerSchema = z.object({
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
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password?.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password || '') },
    { label: 'One lowercase letter', met: /[a-z]/.test(password || '') },
    { label: 'One number', met: /[0-9]/.test(password || '') },
    { label: 'One special character', met: /[^a-zA-Z0-9]/.test(password || '') },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await api('/users/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">FEMS</h1>
          <p className="text-primary-100">Fire Extinguisher Management System</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 mb-6">Join FEMS and start managing extinguishers</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              {password && (
                <div className="mt-3 space-y-2">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-2 text-sm ${
                        req.met ? 'text-success-600' : 'text-gray-400'
                      }`}
                    >
                      <Check size={16} />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              className="mt-6"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="link font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-100 text-sm mt-8">
          © 2026 TZW LTD. All rights reserved.
        </p>
      </div>
    </div>
  );
};
