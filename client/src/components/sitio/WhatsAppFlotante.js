import WhatsAppIcon from './WhatsAppIcon';
import { linkNegocio } from '@/lib/whatsapp';

export default function WhatsAppFlotante() {
  return (
    <a
      href={linkNegocio('Hola! Vi su página y quisiera consultar.')}
      target="_blank"
      rel="noopener"
      className="wa-float"
      title="Contactar por WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}
