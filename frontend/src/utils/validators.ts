import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
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

export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Extinguisher schemas
export const extinguisherSchema = z.object({
  serialNumber: z.string()
    .min(1, 'Serial number is required')
    .min(3, 'Serial number must be at least 3 characters'),
  location: z.string()
    .min(1, 'Location is required')
    .min(3, 'Location must be at least 3 characters'),
  type: z.enum(['Water', 'CO2', 'Foam', 'Dry Chemical'], {
    errorMap: () => ({ message: 'Please select a valid type' }),
  }),
  size: z.enum(['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'], {
    errorMap: () => ({ message: 'Please select a valid size' }),
  }),
  installationDate: z.string()
    .min(1, 'Installation date is required')
    .datetime('Invalid date format'),
  expiryDate: z.string()
    .min(1, 'Expiry date is required')
    .datetime('Invalid date format'),
  status: z.enum(['Active', 'Expired', 'Needs Maintenance', 'Decommissioned']).optional(),
}).refine(
  (data) => new Date(data.expiryDate) > new Date(data.installationDate),
  {
    message: 'Expiry date must be after installation date',
    path: ['expiryDate'],
  }
);

// Inspection schemas
export const inspectionSchema = z.object({
  extinguisherId: z.string()
    .min(1, 'Extinguisher is required'),
  scheduledAt: z.string()
    .min(1, 'Scheduled date and time is required')
    .datetime('Invalid date format'),
  assignedTo: z.string()
    .min(1, 'Inspector email is required')
    .email('Invalid email format'),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.scheduledAt) > new Date(),
  {
    message: 'Scheduled date must be in the future',
    path: ['scheduledAt'],
  }
);

export const maintenanceLogSchema = z.object({
  actionTaken: z.string()
    .min(1, 'Action taken is required')
    .min(10, 'Action taken must be at least 10 characters'),
  actionDate: z.string()
    .min(1, 'Action date is required')
    .datetime('Invalid date format'),
  conditionsNoted: z.string()
    .min(1, 'Conditions noted are required')
    .min(10, 'Conditions noted must be at least 10 characters'),
});

// User management schemas
export const createUserSchema = z.object({
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

export const updateUserSchema = z.object({
  role: z.enum(['Admin', 'Inspector', 'User']).optional(),
  isActive: z.boolean().optional(),
});

// Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ExtinguisherFormData = z.infer<typeof extinguisherSchema>;
export type InspectionFormData = z.infer<typeof inspectionSchema>;
export type MaintenanceLogFormData = z.infer<typeof maintenanceLogSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
