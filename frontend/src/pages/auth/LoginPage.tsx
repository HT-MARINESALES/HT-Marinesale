import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort zu kurz'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const { error } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password);
      // Navigation is handled automatically by PublicOnlyRoute once
      // onAuthStateChange fires and the profile is loaded.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('confirm')) {
        error('E-Mail nicht bestätigt', 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.');
      } else if (msg.toLowerCase().includes('invalid')) {
        error('Anmeldung fehlgeschlagen', 'E-Mail oder Passwort ist falsch.');
      } else {
        error('Anmeldung fehlgeschlagen', msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="HT-Marinesales" className="h-[70px] w-auto mx-auto" />
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Willkommen zurück</h2>
          <p className="text-gray-500 text-sm mt-1">Melden Sie sich in Ihrem Konto an</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="E-Mail-Adresse"
              type="email"
              required
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Passwort"
              type="password"
              required
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="flex justify-end">
              <Link to="/auth/passwort-vergessen" className="text-sm text-navy-600 hover:underline">
                Passwort vergessen?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Anmelden
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link to="/auth/register" className="text-navy-700 font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
