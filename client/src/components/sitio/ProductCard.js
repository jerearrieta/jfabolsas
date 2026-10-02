import Image from 'next/image';
import { linkNegocio } from '@/lib/whatsapp';

export default function ProductCard({ producto }) {
  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <Image
          className="product-img"
          src={producto.imagen}
          alt={producto.nombre}
          width={600}
          height={800}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="product-header">
        <span className="product-header-icon">{producto.icono}</span>
        <h3>{producto.nombre}</h3>
      </div>
      <div className="product-body">
        <div className="sizes-grid">
          {producto.medidas.map((m) => (
            <span key={m} className="size-tag">
              {m} cm
            </span>
          ))}
        </div>
        <a href={linkNegocio(producto.mensaje)} target="_blank" rel="noopener" className="consultar-btn">
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
