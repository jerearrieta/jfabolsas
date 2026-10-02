import WhatsAppIcon from './WhatsAppIcon';
import { linkNegocio } from '@/lib/whatsapp';

const tarjetas = [
  { icono: '👜', titulo: 'Bolsitas', texto: 'Varios tamaños desde 10×10' },
  { icono: '🎒', titulo: 'Mochilas', texto: 'Resistentes y prácticas' },
  { icono: '✂️', titulo: 'Pedidos a medida', texto: 'Diseñamos según tus necesidades específicas', ancha: true },
];

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero-pattern" />
      <div className="hero-content">
        <div className="hero-text">
          <span className="hero-tag">Artesanal · Córdoba</span>
          <h1>
            Bolsas de lienzo
            <br />
            <em>hechas con cuidado</em>
          </h1>
          <p className="hero-sub">
            Fabricamos bolsas de lienzo de alta calidad para uso personal, comercial o como regalo. Medidas estándar o a
            pedido, siempre con la atención que tu proyecto merece.
          </p>
          <div className="hero-actions">
            <a href="#productos" className="btn-primary">
              Ver productos
            </a>
            <a
              href={linkNegocio('Hola! Vi su página y quiero consultar sobre sus bolsas de lienzo.')}
              target="_blank"
              rel="noopener"
              className="btn-wa"
            >
              <WhatsAppIcon className="wa-icon" />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
        <div className="hero-visual">
          {tarjetas.map((t) => (
            <div key={t.titulo} className="hero-card" style={t.ancha ? { gridColumn: 'span 2' } : undefined}>
              <span className="hero-card-icon">{t.icono}</span>
              <h3>{t.titulo}</h3>
              <p>{t.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
