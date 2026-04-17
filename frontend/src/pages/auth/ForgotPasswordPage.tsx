import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

type ForgotPasswordData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { error } = useToast();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (err) {
      error('Fehler', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-navy-900 font-bold text-2xl">
            <Anchor className="h-8 w-8 text-blue-600" />
            HT-Marineservice
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Passwort zurücksetzen</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">E-Mail gesendet</h3>
              <p className="text-gray-500 text-sm">
                Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Reset-Link geschickt.
              </p>
              <Link to="/auth/login" className="mt-4 inline-block text-navy-600 hover:underline text-sm font-medium">
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="text-sm text-gray-500">
                Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen des Passworts.
              </p>
              <Input
                label="E-Mail-Adresse"
                type="email"
                required
                {...register('email')}
                error={errors.email?.message as string | undefined}
              />
              <Button type="submit" loading={isSubmitting} className="w-full">
                Reset-Link senden
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center">
              <Link to="/auth/login" className="text-sm text-navy-600 hover:underline">
                Zurück zur Anmeldung
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
