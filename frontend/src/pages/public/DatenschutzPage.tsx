export function DatenschutzPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-navy-900 mb-8">Datenschutzerklärung</h1>

        {/* 1 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Allgemeine Hinweise</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
            personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
            Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche
            Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten
            Datenschutzerklärung.
          </p>
          <h3 className="text-base font-semibold text-gray-800 mb-2">Datenerfassung auf dieser Website</h3>
          <p className="text-gray-700 leading-relaxed mb-2">
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
            Kontaktdaten können Sie dem Abschnitt „Verantwortliche Stelle" in dieser
            Datenschutzerklärung entnehmen.
          </p>
          <p className="text-gray-700 leading-relaxed mb-2">
            <strong>Wie erfassen wir Ihre Daten?</strong>
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann
            es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben oder bei der
            Registrierung angeben. Andere Daten werden automatisch beim Besuch der Website durch
            unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser,
            Betriebssystem oder Uhrzeit des Seitenaufrufs).
          </p>
          <p className="text-gray-700 leading-relaxed mb-2">
            <strong>Wofür nutzen wir Ihre Daten?</strong>
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
            gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
          </p>
          <p className="text-gray-700 leading-relaxed mb-2">
            <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
          </p>
          <p className="text-gray-700 leading-relaxed">
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
            Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein
            Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
            Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit
            für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen
            die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des
            Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
          </p>
        </section>

        {/* 2 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">2. Hosting und technische Infrastruktur</h2>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Vercel (Webhosting Frontend &amp; Backend)</h3>
            <p className="text-gray-700 leading-relaxed">
              Anbieter ist Vercel Inc., 340 Pine Street Suite 701, San Francisco, CA 94104, USA.
              Wenn Sie unsere Website besuchen, erfasst Vercel automatisch Logfiles (z. B. IP-Adresse,
              aufgerufene Seiten, Zeitstempel). Details finden Sie in der Datenschutzerklärung von
              Vercel:{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-600 hover:underline"
              >
                https://vercel.com/legal/privacy-policy
              </a>
              . Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Supabase (Datenbank &amp; Authentifizierung)</h3>
            <p className="text-gray-700 leading-relaxed">
              Anbieter ist Supabase Inc., 970 Toa Payoh North, #07-04, Singapore 318992. Supabase
              verarbeitet Anmeldedaten und Nutzerdaten, die beim Betrieb der Plattform anfallen.
              Details:{' '}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-600 hover:underline"
              >
                https://supabase.com/privacy
              </a>
              . Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Resend (E-Mail-Versand)</h3>
            <p className="text-gray-700 leading-relaxed">
              Anbieter ist Resend Inc., 2261 Market Street #5039, San Francisco, CA 94114, USA.
              Resend verarbeitet E-Mail-Adressen zum Versand transaktionaler E-Mails (z. B.
              Registrierungsbestätigung, Passwort-Reset). Details:{' '}
              <a
                href="https://resend.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-600 hover:underline"
              >
                https://resend.com/legal/privacy-policy
              </a>
              . Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Strato (Domain &amp; E-Mail-Postfach)</h3>
            <p className="text-gray-700 leading-relaxed">
              Anbieter ist die Strato AG, Otto-Ostrowski-Straße 7, 10249 Berlin. Strato stellt
              die Domain und das E-Mail-Postfach bereit. Details:{' '}
              <a
                href="https://www.strato.de/datenschutz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-600 hover:underline"
              >
                https://www.strato.de/datenschutz/
              </a>
              . Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </div>
        </section>

        {/* 3 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Verantwortliche Stelle</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
          </p>
          <div className="text-gray-700 space-y-1 mb-6">
            <p className="font-semibold">Tobias Hemmerlein</p>
            <p>Im Maintal 8a, 96173 Oberhaid</p>
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

          <h3 className="text-base font-semibold text-gray-800 mb-2">Speicherdauer</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
            wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
            Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen
            oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
            sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer
            personenbezogenen Daten haben.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Widerruf Ihrer Einwilligung</h3>
          <p className="text-gray-700 leading-relaxed">
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
            möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
            Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf
            unberührt.
          </p>
        </section>

        {/* 4 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">4. Datenerfassung auf dieser Website</h2>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Cookies</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Wir verwenden ausschließlich technisch notwendige Session-Cookies zur Authentifizierung.
            Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Kontaktformular</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus
            dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks
            Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
            Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Rechtsgrundlage:
            Art. 6 Abs. 1 lit. f DSGVO.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Registrierung als Verkäufer</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Bei der Registrierung als Verkäufer erheben wir Name, E-Mail-Adresse und Telefonnummer
            zur Durchführung des Vertragsverhältnisses (Kommissionsvertrag, Abwicklung des
            Bootsverkaufs). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mb-2">Bootsinserate</h3>
          <p className="text-gray-700 leading-relaxed">
            Von Verkäufern eingestellte Bootsinserate (Bilder, Beschreibungen, technische Daten)
            werden in unserer Datenbank bei Supabase gespeichert und nach Freischaltung öffentlich
            auf der Plattform angezeigt.
          </p>
        </section>

        {/* 5 */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">5. Ihre Rechte</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
            Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Zuständige Aufsichtsbehörde
            in Bayern ist das{' '}
            <strong>Landesamt für Datenschutzaufsicht Bayern (BayLDA)</strong>,
            Promenade 18, 91522 Ansbach,{' '}
            <a
              href="https://www.lda.bayern.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy-600 hover:underline"
            >
              www.lda.bayern.de
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
