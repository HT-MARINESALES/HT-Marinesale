import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  password: z.string().min(8, 'Mindestens 8 Zeichen erforderlich'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

type Mode = 'loading' | 'form' | 'success' | 'invalid';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('loading');
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let resolved = false;

    const resolve = (m: Mode) => {
      if (!resolved) {
        resolved = true;
        setMode(m);
      }
    };

    // Listen for Supabase recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolve('form');
      }
    });

    // Also check if there's already an active recovery session (event may have fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolve('form');
      }
    });

    // Fallback: if no recovery event within 4s, show invalid link
    const timeout = setTimeout(() => resolve('invalid'), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setSubmitError(error.message || 'Passwort konnte nicht geändert werden.');
      return;
    }
    await supabase.auth.signOut();
    setMode('success');
    setTimeout(() => navigate('/auth/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="HT-Marinesales" className="h-[70px] w-auto mx-auto" />
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Neues Passwort festlegen</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {mode === 'loading' && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Link wird geprüft…</p>
            </div>
          )}

          {mode === 'invalid' && (
            <div className="text-center py-4">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Ungültiger Link</h3>
              <p className="text-gray-500 text-sm mb-4">
                Dieser Reset-Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen an.
              </p>
              <Link to="/auth/passwort-vergessen">
                <Button variant="outline" className="w-full">Neuen Link anfordern</Button>
              </Link>
            </div>
          )}

          {mode === 'form' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-navy-700 bg-navy-50 rounded-lg px-3 py-2 mb-2">
                <KeyRound className="h-4 w-4 shrink-0" />
                Bitte wählen Sie ein sicheres Passwort (mind. 8 Zeichen).
              </div>

              <Input
                label="Neues Passwort"
                type="password"
                required
                autoFocus
                {...register('password')}
                error={errors.password?.message}
              />
              <Input
                label="Passwort bestätigen"
                type="password"
                required
                {...register('confirm')}
                error={errors.confirm?.message}
              />

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
              )}

              <Button type="submit" loading={isSubmitting} className="w-full">
                Passwort speichern
              </Button>
            </form>
          )}

          {mode === 'success' && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Passwort geändert!</h3>
              <p className="text-gray-500 text-sm">
                Sie werden zur Anmeldeseite weitergeleitet…
              </p>
            </div>
          )}
        </div>

        {mode !== 'success' && (
          <div className="mt-6 text-center">
            <Link to="/auth/login" className="text-sm text-navy-600 hover:underline">
              Zurück zur Anmeldung
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
