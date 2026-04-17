import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useState } from 'react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name zu kurz').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().max(50).optional(),
  message: z.string().min(10, 'Nachricht zu kurz (min. 10 Zeichen)').max(2000),
  website: z.string().optional(), // honeypot — must stay empty
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  listingId?: string;
  onSuccess?: () => void;
}

export function ContactForm({ listingId, onSuccess }: ContactFormProps) {
  const { success, error } = useToast();
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await api.post('/contact', { ...data, listing_id: listingId });
      setSent(true);
      success('Nachricht gesendet!', 'Wir melden uns so schnell wie möglich bei Ihnen.');
      onSuccess?.();
    } catch (err) {
      error('Fehler beim Senden', err instanceof Error ? err.message : 'Unbekannter Fehler');
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nachricht gesendet!</h3>
        <p className="text-gray-500">Wir werden uns schnellstmöglich bei Ihnen melden.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Ihr Name"
        required
        {...register('name')}
        error={errors.name?.message}
      />
      <Input
        label="E-Mail-Adresse"
        type="email"
        required
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Telefon (optional)"
        type="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Textarea
        label="Ihre Nachricht"
        required
        rows={5}
        placeholder="Schreiben Sie uns Ihre Anfrage..."
        {...register('message')}
        error={errors.message?.message}
      />
      {/* Honeypot field — hidden from real users, bots fill it in */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true" tabIndex={-1}>
        <input
          type="text"
          autoComplete="off"
          tabIndex={-1}
          {...register('website')}
        />
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Nachricht senden
      </Button>
    </form>
  );
}
