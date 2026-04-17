import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img src="/logo.png" alt="HT-Marinesales" className="h-24 w-auto" />
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Ihr vertrauenswürdiger Partner für geprüfte Boote und Yachten.
              Wir verbinden Käufer und Verkäufer mit professionellem Service und persönlicher Beratung.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a href="mailto:info@ht-marinesales.de" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                info@ht-marinesales.de
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/boote" className="text-gray-400 hover:text-white transition-colors">Boote kaufen</Link></li>
              <li><Link to="/checkup" className="text-gray-400 hover:text-white transition-colors">Check-up Service</Link></li>
              <li><Link to="/bootsmarken" className="text-gray-400 hover:text-white transition-colors">Bootsmarken A–Z</Link></li>
              <li><Link to="/kontakt" className="text-gray-400 hover:text-white transition-colors">Kontakt</Link></li>
              <li><Link to="/auth/register" className="text-gray-400 hover:text-white transition-colors">Boot verkaufen</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Informationen</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/checkup" className="text-gray-400 hover:text-white transition-colors">Über den Check-up</Link></li>
              <li><span className="text-gray-400">Provision: max. 8 % – gestaffelt nach Preis</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-10 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} HT-Marinesales. Alle Rechte vorbehalten.</p>
          <p className="mt-2 flex items-center justify-center gap-4">
            <Link to="/impressum" className="text-gray-500 hover:text-white transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="text-gray-500 hover:text-white transition-colors">Datenschutz</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
