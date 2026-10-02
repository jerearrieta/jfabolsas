import Nav from '@/components/sitio/Nav';
import Hero from '@/components/sitio/Hero';
import Catalogo from '@/components/sitio/Catalogo';
import Cotizador from '@/components/sitio/Cotizador';
import PedidoEspecial from '@/components/sitio/PedidoEspecial';
import Contacto from '@/components/sitio/Contacto';
import Footer from '@/components/sitio/Footer';
import WhatsAppFlotante from '@/components/sitio/WhatsAppFlotante';

export default function Inicio() {
  return (
    <>
      <Nav />
      <Hero />
      <Catalogo />
      <Cotizador />
      <PedidoEspecial />
      <Contacto />
      <Footer />
      <WhatsAppFlotante />
    </>
  );
}
