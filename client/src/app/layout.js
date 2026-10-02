import { DM_Sans, Playfair_Display } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-dm-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-playfair' });

export const metadata = {
  title: 'JFA Bolsas – Bolsas de Lienzo Artesanales',
  description: 'Bolsas de lienzo artesanales en Córdoba. Medidas estándar o a pedido, con presupuesto al instante.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
