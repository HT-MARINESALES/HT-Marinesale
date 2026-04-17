import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import type { Profile } from '@/types';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Pflichtfeld').max(100),
  last_name: z.string().min(1, 'Pflichtfeld').max(100),
  phone: z.string().max(50).optional(),
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Pflichtfeld'),
  new_password: z.string().min(8, 'Mindestens 8 Zeichen'),
  confirm_password: z.string().min(1, 'Pflichtfeld'),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm_password'],
});

const emailSchema = z.object({
  new_email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Pflichtfeld'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

// forwardRef is required so React Hook Form's ref callback reaches the native <input>.
// Without it, React strips the ref from props before the component receives them,
// RHF never sees the DOM value, and Zod reports "Required" for every field.
const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`w-full h-10 px-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

export function SellerProfilePage() {
  const { profile } = useAuth() as ReturnType<typeof useAuth> & { setProfile?: (p: Profile) => void };
  const { success, error } = useToast();

  // Profile form
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      street: profile?.street || '',
      city: profile?.city || '',
      postal_code: profile?.postal_code || '',
      country: profile?.country || 'Deutschland',
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileFormData) => api.put<Profile>('/auth/profile', data),
    onSuccess: () => { success('Profil gespeichert'); },
    onError: (err) => { error('Fehler', err instanceof Error ? err.message : 'Fehler beim Speichern'); },
  });

  // Password form
  const {
    register: registerPw,
    handleSubmit: handlePw,
    formState: { errors: pwErrors },
    reset: resetPw,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const changePassword = useMutation({
    mutationFn: (data: PasswordFormData) =>
      api.post('/auth/change-password', { current_password: data.current_password, new_password: data.new_password }),
    onSuccess: () => { success('Passwort geändert'); resetPw(); },
    onError: (err) => { error('Fehler', err instanceof Error ? err.message : 'Passwort konnte nicht geändert werden'); },
  });

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmail,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });

  const changeEmail = useMutation({
    mutationFn: (data: EmailFormData) =>
      api.post('/auth/change-email', data),
    onSuccess: () => { success('E-Mail-Adresse geändert', 'Sie können sich ab sofort mit der neuen Adresse anmelden.'); resetEmail(); },
    onError: (err) => { error('Fehler', err instanceof Error ? err.message : 'E-Mail konnte nicht geändert werden'); },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mein Profil</h1>
        <p className="text-gray-500 mt-1">Aktualisieren Sie Ihre persönlichen Daten</p>
      </div>

      {/* Profile data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Persönliche Daten</h2>
        <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vorname" required {...register('first_name')} error={errors.first_name?.message} />
            <Input label="Nachname" required {...register('last_name')} error={errors.last_name?.message} />
          </div>
          <Input label="Telefon" type="tel" {...register('phone')} error={errors.phone?.message} />
          <Input label="Straße & Hausnummer" {...register('street')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="PLZ" {...register('postal_code')} />
            <div className="col-span-2">
              <Input label="Stadt" {...register('city')} />
            </div>
          </div>
          <Input label="Land" {...register('country')} />
          <div className="pt-2">
            <Button type="submit" loading={updateProfile.isPending}>Profil speichern</Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Passwort ändern</h2>
        <p className="text-sm text-gray-500 mb-5">Geben Sie Ihr aktuelles Passwort ein, um ein neues zu setzen.</p>
        <form onSubmit={handlePw(d => changePassword.mutate(d))} className="space-y-4">
          <PasswordInput
            label="Aktuelles Passwort"
            {...registerPw('current_password')}
            error={pwErrors.current_password?.message}
          />
          <PasswordInput
            label="Neues Passwort"
            {...registerPw('new_password')}
            error={pwErrors.new_password?.message}
          />
          <PasswordInput
            label="Neues Passwort bestätigen"
            {...registerPw('confirm_password')}
            error={pwErrors.confirm_password?.message}
          />
          <div className="pt-2">
            <Button type="submit" loading={changePassword.isPending}>Passwort ändern</Button>
          </div>
        </form>
      </div>

      {/* Change email */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">E-Mail-Adresse ändern</h2>
        <p className="text-sm text-gray-500 mb-5">
          Aktuelle Adresse: <strong>{profile?.email}</strong><br />
          Zur Bestätigung wird Ihr aktuelles Passwort benötigt.
        </p>
        <form onSubmit={handleEmail(d => changeEmail.mutate(d))} className="space-y-4">
          <Input
            label="Neue E-Mail-Adresse"
            type="email"
            {...registerEmail('new_email')}
            error={emailErrors.new_email?.message}
          />
          <PasswordInput
            label="Passwort zur Bestätigung"
            {...registerEmail('password')}
            error={emailErrors.password?.message}
          />
          <div className="pt-2">
            <Button type="submit" loading={changeEmail.isPending}>E-Mail-Adresse ändern</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
