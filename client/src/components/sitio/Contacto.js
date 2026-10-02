import WhatsAppIcon from './WhatsAppIcon';
import { linkNegocio } from '@/lib/whatsapp';
import { INSTAGRAM } from '@/lib/config';

export default function Contacto() {
  return (
    <section id="contacto">
      <div className="section-inner">
        <span className="section-label" style={{ color: 'var(--jute)' }}>
          Contacto
        </span>
        <h2 className="section-title">¿Hablamos?</h2>
        <p className="section-sub">
          Estamos en Córdoba y respondemos rápido por WhatsApp. Si tenés alguna duda o consulta, no dudes en escribirnos.
        </p>
        <div className="contact-actions">
          <a
            href={linkNegocio('Hola! Vi su página y quisiera consultar sobre sus productos.')}
            target="_blank"
            rel="noopener"
            className="btn-wa"
          >
            <WhatsAppIcon className="wa-icon" />
            Escribir por WhatsApp
          </a>
          <a href="#productos" className="btn-light">
            Ver catálogo completo
          </a>
          <a href={`https://www.instagram.com/${INSTAGRAM}`} target="_blank" rel="noopener" className="btn-light">
            Instagram @{INSTAGRAM}
          </a>
        </div>
      </div>
    </section>
  );
}
