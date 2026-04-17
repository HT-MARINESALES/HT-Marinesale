import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Camera, FileText, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CheckupInfoPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="h-4 w-4 text-green-300" />
            <span className="text-sm text-green-200 font-medium">Professioneller Expertendienst</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Der HT-Marineservice Check-up
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Mehr Vertrauen für Käufer und Verkäufer: Jedes Boot auf unserer Plattform wird
            bei uns vor Ort von unseren erfahrenen Marine-Experten persönlich begutachtet.
          </p>
        </div>
      </section>

      {/* What is it */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">Was ist der Check-up?</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Beim HT-Marineservice Check-up bringen Sie Ihr Boot zu uns. Unsere zertifizierten Marine-Experten prüfen
            bei uns vor Ort den allgemeinen Zustand des Rumpfes, der Motoren, der technischen Anlagen und der Sicherheitsausrüstung.
            Bei größeren Booten, die nicht transportiert werden können, kommen wir auf Anfrage zum Liegeplatz.
            Das Ergebnis: <strong className="text-navy-900 underline">Ein unabhängiges, professionelles Zustandsgutachten.</strong>
          </p>
          <p className="text-gray-600 leading-relaxed">
            Dieses Gutachten schafft Transparenz für potenzielle Käufer und schützt Sie als Verkäufer
            vor späteren Reklamationen aufgrund unbekannter Mängel.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-navy-900 mb-8">So läuft es ab</h2>

          {[
            {
              num: '01',
              icon: FileText,
              title: 'Inserat erstellen',
              desc: 'Erstellen Sie Ihr Inserat mit allen verfügbaren Informationen zu Ihrem Boot. Je detaillierter, desto besser.',
            },
            {
              num: '02',
              icon: CheckCircle,
              title: 'Einreichung zur Prüfung',
              desc: 'Reichen Sie Ihr Inserat zur Prüfung ein. Unser Team nimmt Kontakt mit Ihnen auf, um einen Termin zu vereinbaren. Sie können auch direkt einen Termin für den Check-up bei uns vereinbaren.',
            },
            {
              num: '03',
              icon: Camera,
              title: 'Persönliche Begutachtung',
              desc: 'Ihr Boot wird bei uns vor Ort gründlich inspiziert und alles mit Fotos dokumentiert. Bei größeren Booten, die nicht transportiert werden können, kommen wir auf Anfrage zum Liegeplatz.',
            },
            {
              num: '04',
              icon: Shield,
              title: 'Freischaltung & Verkauf',
              desc: 'Nach dem erfolgreichen Check-up wird Ihr Inserat freigeschaltet. Käufer sehen das Prüfsiegel und vertrauen dem Angebot.',
            },
          ].map(step => (
            <div key={step.num} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Schritt {step.num}</span>
                </div>
                <h3 className="font-semibold text-navy-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provision table */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-navy-900 mb-6">Unsere Provision – transparent & gestaffelt</h2>
        <p className="text-gray-600 mb-6">
          Je höher der Verkaufspreis Ihres Bootes, desto niedriger unsere Provision. Maximal zahlen Sie <strong>8 %</strong>.
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-navy-900 text-white">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Verkaufspreis</th>
                <th className="text-right px-6 py-3 font-semibold">Provision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { range: 'bis 50.000 €', rate: '8 %' },
                { range: '50.001 € – 150.000 €', rate: '5 %' },
                { range: '150.001 € – 400.000 €', rate: '3,5 %' },
                { range: 'über 400.000 €', rate: '2,5 %' },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.range}</td>
                  <td className="px-6 py-4 text-right font-bold text-navy-900">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Die Provision wird nur im Erfolgsfall fällig. Check-up-Kosten werden vollständig auf die Provision angerechnet.
        </p>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-10">Vorteile des Check-ups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Für Verkäufer',
                points: [
                  'Höheres Vertrauen bei potenziellen Käufern',
                  'Schnellerer Verkauf durch Transparenz',
                  'Schutz vor Reklamationen',
                  'Professionelle Dokumentation',
                  'Max. 8 % Provision bei Verkauf – gestaffelt nach Preis',
                ],
              },
              {
                title: 'Für Käufer',
                points: [
                  'Unabhängige Expertenprüfung',
                  'Keine bösen Überraschungen',
                  'Transparente Zustandsbeschreibung',
                  'Sicherheit beim Bootskauf',
                  'Professionelle Beratung',
                ],
              },
            ].map(group => (
              <div key={group.title} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-navy-900 text-lg mb-4">{group.title}</h3>
                <ul className="space-y-3">
                  {group.points.map(point => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Star className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Bereit? Inserieren Sie Ihr Boot
          </h2>
          <p className="text-gray-500 mb-8">
            Starten Sie noch heute und lassen Sie uns Ihr Boot professionell vermarkten.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg">
                Kostenlos registrieren
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/kontakt">
              <Button variant="outline" size="lg">
                Fragen stellen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
