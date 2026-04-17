export function ImpressumPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-8">Impressum</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">Angaben gemäß § 5 TMG</h2>
          <div className="text-gray-700 space-y-1">
            <p className="font-semibold">Tobias Hemmerlein</p>
            <p>HT-Marinesales</p>
            <p>Im Maintal 8a</p>
            <p>96173 Oberhaid</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">Kontakt</h2>
          <div className="text-gray-700 space-y-1">
            <p>
              Telefon:{' '}
              <a href="tel:+491629672010" className="text-navy-600 hover:underline">
                +49 162 967 2010
              </a>
            </p>
            <p>
              E-Mail:{' '}
              <a href="mailto:info@ht-marinesales.de" className="text-navy-600 hover:underline">
                info@ht-marinesales.de
              </a>
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">
            Streitschlichtung
          </h2>
          <p className="text-gray-700">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
