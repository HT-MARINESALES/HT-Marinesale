import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';

export function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-navy-900 mb-4">Kontakt</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Haben Sie Fragen zu unserem Service? Möchten Sie Ihr Boot verkaufen oder suchen Sie das perfekte Boot?
          Wir helfen Ihnen gerne weiter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-semibold text-navy-900 mb-6">Schreiben Sie uns</h2>
          <ContactForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-navy-900 mb-6">Kontaktdaten</h2>

          <div className="bg-navy-50 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-navy-900">E-Mail</p>
                <a href="mailto:info@marine-service-sales.de" className="text-ocean-500 hover:underline">
                  info@marine-service-sales.de
                </a>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Über HT-Marineservice</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              HT-Marineservice ist Ihr professioneller Partner für den Kauf und Verkauf von Booten und Yachten.
              Unser Alleinstellungsmerkmal ist der persönliche Check-up Service: Jedes Boot auf unserer Plattform
              wird von erfahrenen Experten begutachtet – für maximale Transparenz und Sicherheit.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Provision: <strong className="text-gray-900">max. 8 %</strong> – gestaffelt nach Verkaufspreis</p>
              <p className="text-sm text-gray-500 mt-1">Keine Kosten bis zum Verkauf</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
