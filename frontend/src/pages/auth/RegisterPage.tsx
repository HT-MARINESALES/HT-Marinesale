import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Mail, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';

interface ContractInfo {
  version: string;
  download_url: string;
  file_name: string;
}

const registerSchema = z.object({
  firstName: z.string().min(2, 'Vorname zu kurz').max(100),
  lastName: z.string().min(2, 'Nachname zu kurz').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  passwordConfirm: z.string(),
  contractAccepted: z.boolean().refine(v => v, 'Sie müssen den Bedingungen zustimmen'),
}).refine(d => d.password === d.passwordConfirm, {
  message: 'Passwörter stimmen nicht überein',
  path: ['passwordConfirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { signUp } = useAuth();
  const { error } = useToast();
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  const { data: contractData } = useQuery<ContractInfo>({
    queryKey: ['contract-current'],
    queryFn: () => api.get<ContractInfo>('/contract/current'),
    retry: false,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await signUp(data.email, data.password, data.firstName, data.lastName);

      if (result.user) {
        // Record contract acceptance via backend (uses service role, bypasses RLS)
        // This works even if email confirmation is required (no active session yet)
        try {
          await api.post('/contract/accept', {
            user_id: result.user.id,
            contract_version: contractData?.version || 'v1',
            user_agent: navigator.userAgent,
          });
        } catch (e) {
          console.error('Contract acceptance recording failed:', e);
          // Non-fatal — seller can contact support if needed
        }
      }

      if (result.session) {
        // Email auto-confirmed (e.g. confirmation disabled in Supabase)
        // Navigate to seller dashboard
        window.location.href = '/seller';
      } else {
        // Email confirmation required
        setConfirmedEmail(data.email);
      }
    } catch (err) {
      error('Registrierung fehlgeschlagen', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  // Email confirmation pending screen
  if (confirmedEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <Link to="/">
            <img src="/logo.png" alt="HT-Marineservice" className="h-[70px] w-auto mx-auto" />
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mt-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">E-Mail bestätigen</h2>
            <p className="text-gray-500 text-sm mb-4">
              Wir haben eine Bestätigungsmail an <strong>{confirmedEmail}</strong> gesendet.
              Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 mb-6">
              Bitte prüfen Sie auch Ihren Spam-Ordner.
            </div>
            <Link to="/auth/login">
              <Button variant="outline" className="w-full">
                Zurück zum Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="HT-Marineservice" className="h-[70px] w-auto mx-auto" />
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 mt-6">Konto erstellen</h2>
          <p className="text-gray-500 text-sm mt-1">Verkaufen Sie Ihr Boot professionell</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-navy-900 text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            So funktioniert es
          </h3>
          <ul className="text-xs text-navy-800 space-y-1">
            <li>• Inserat erstellen und Details eintragen</li>
            <li>• Persönlicher Check-up durch unsere Experten</li>
            <li>• Freischaltung und Verkauf</li>
            <li>• <strong>Provision: max. 8 % bei Verkauf (gestaffelt nach Preis)</strong></li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Vorname" required autoComplete="given-name" {...register('firstName')} error={errors.firstName?.message} />
              <Input label="Nachname" required autoComplete="family-name" {...register('lastName')} error={errors.lastName?.message} />
            </div>
            <Input label="E-Mail-Adresse" type="email" required autoComplete="email" {...register('email')} error={errors.email?.message} />
            <Input label="Passwort" type="password" required autoComplete="new-password" hint="Mindestens 8 Zeichen" {...register('password')} error={errors.password?.message} />
            <Input label="Passwort bestätigen" type="password" required autoComplete="new-password" {...register('passwordConfirm')} error={errors.passwordConfirm?.message} />

            {/* Contract — prominent box */}
            <div className={`rounded-xl border-2 ${errors.contractAccepted ? 'border-red-400 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="p-4 border-b border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-700 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">Kommissionsvertrag {contractData?.version ? `(${contractData.version})` : ''}</p>
                    <p className="text-xs text-amber-700">Bitte lesen Sie den Vertrag vor der Registrierung vollständig durch.</p>
                  </div>
                </div>
                {contractData?.download_url && (
                  <a
                    href={contractData.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white text-xs font-medium rounded-lg hover:bg-amber-800 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    PDF öffnen
                  </a>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2 mb-3 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Mit der Registrierung bestätigen Sie, den Kommissionsvertrag gelesen und akzeptiert zu haben. HT-Marineservice erhebt bei erfolgreichem Verkauf eine Provision von <strong>max. 8 % (gestaffelt nach Verkaufspreis)</strong>.</span>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" {...register('contractAccepted')} className="rounded border-amber-400 text-amber-700 focus:ring-amber-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-900">
                    Ich habe den Kommissionsvertrag gelesen und akzeptiere ihn verbindlich.
                  </span>
                </label>
                {errors.contractAccepted && (
                  <p className="text-xs text-red-600 mt-2 font-medium">{errors.contractAccepted.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Konto erstellen
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Bereits ein Konto?{' '}
            <Link to="/auth/login" className="text-navy-700 font-medium hover:underline">Anmelden</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
