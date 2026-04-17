import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, CheckCircle, TrendingUp, Anchor, Phone, Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { usePublicListings } from '@/hooks/useListings';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = usePublicListings({ limit: 6, sort: 'newest' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/boote${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const stats = [
    { label: 'Geprüfte Boote', value: data?.total || '0', suffix: '+' },
    { label: 'Zufriedene Verkäufer', value: '50', suffix: '+' },
    { label: 'Jahre Erfahrung', value: '10', suffix: '+' },
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '560px' }}>
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ pointerEvents: 'none' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        {/* Blue transparent overlay */}
        <div className="absolute inset-0 bg-navy-900/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
              <Shield className="h-4 w-4 text-blue-300" />
              <span className="text-sm text-blue-200 font-medium">Professionell geprüft & zertifiziert</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Ihr Boot verkaufen –<br />
              <span className="text-blue-300">mit HT-Marinesales</span>
            </h1>

            <p className="text-lg text-blue-100 mb-8 max-w-2xl leading-relaxed">
              Kaufen und verkaufen Sie Boote mit professionellem Check-up Service.
              Jedes Boot wird bei uns vor Ort von unseren Experten geprüft – für maximale Sicherheit und Vertrauen.
              Faire Provision ab <strong className="text-white">2,5 %</strong> – gestaffelt nach Verkaufspreis.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Marke, Modell oder Typ suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-12 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="bg-blue-500 hover:bg-blue-600 border-0 px-6">
                Suchen
              </Button>
            </form>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              {stats.map(stat => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-white">
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-blue-200 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Aktuelle Inserate</h2>
            <p className="text-gray-500 mt-1">Alle Boote wurden professionell geprüft</p>
          </div>
          <Link to="/boote">
            <Button variant="outline" className="hidden sm:flex items-center gap-2">
              Alle anzeigen
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ListingGrid
          listings={data?.data || []}
          loading={isLoading}
          emptyMessage="Noch keine Inserate verfügbar"
        />

        <div className="text-center mt-8">
          <Link to="/boote">
            <Button variant="outline" size="lg">
              Alle Boote anzeigen
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Check-up process */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-900 mb-4">
              Der HT-Marinesales Check-up
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Jedes Boot auf unserer Plattform wird bei uns vor Ort von unseren Experten persönlich begutachtet.
              Das schafft Vertrauen für Käufer und Verkäufer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Anchor,
                title: 'Inserat einreichen',
                desc: 'Erstellen Sie Ihr Inserat mit allen Details zum Boot. Unser Team prüft die Angaben.',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Persönliche Begutachtung',
                desc: 'Ihr Boot wird bei uns vor Ort von unseren Experten begutachtet. Bei größeren Booten kommen wir auf Anfrage auch zum Liegeplatz. Der Check-up wird vorab bezahlt und beim erfolgreichen Verkauf über HT-Marinesales vollständig gegen die Provision verrechnet.',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Freischaltung & Verkauf',
                desc: 'Nach erfolgreichem Check-up wird Ihr Inserat freigeschaltet. Die Check-up-Kosten werden mit der Provision verrechnet – Sie zahlen also nur den Differenzbetrag.',
              },
            ].map(item => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-4xl font-black text-gray-100">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-navy-900 text-lg mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/checkup">
              <Button variant="outline" size="lg">
                Mehr über den Check-up
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Provision section */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <TrendingUp className="h-10 w-10 text-blue-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Faire, gestaffelte Provision</h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              Je höher der Verkaufspreis, desto niedriger unser Anteil. Transparent und ohne Überraschungen.
            </p>
          </div>

          {/* Provision tiers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {[
              { range: 'bis 50.000 €', rate: '8 %', sub: 'Kleinboote & Einsteiger' },
              { range: '50.001 – 150.000 €', rate: '5 %', sub: 'Motorboote & Segelyachten' },
              { range: '150.001 – 400.000 €', rate: '3,5 %', sub: 'Große Yachten' },
              { range: 'über 400.000 €', rate: '2,5 %', sub: 'Luxusyachten' },
            ].map((tier, i) => (
              <div key={i} className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 text-center">
                <p className="text-3xl font-black text-white mb-1">{tier.rate}</p>
                <p className="text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wide">{tier.range}</p>
                <p className="text-xs text-blue-400">{tier.sub}</p>
              </div>
            ))}
          </div>

          {/* Bullets */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              'Kostenlose Inserat-Erstellung',
              'Check-up Kosten werden vollständig auf die Provision angerechnet',
              'Provision nur bei erfolgreichem Verkauf',
              'Keine monatlichen Gebühren oder versteckte Kosten',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-blue-100">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/auth/register">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 border-0 text-white px-8">
                Jetzt Boot inserieren
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Haben Sie Fragen?</h2>
          <p className="text-gray-500 mb-8">
            Wir helfen Ihnen gerne beim Verkauf Ihres Bootes oder bei der Suche nach dem perfekten Boot.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:info@ht-marinesales.de">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-Mail schreiben
              </Button>
            </a>
            <Link to="/kontakt">
              <Button size="lg">
                Kontaktformular
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
