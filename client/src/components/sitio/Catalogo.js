import ProductCard from './ProductCard';
import { productos } from '@/data/catalogo';

export default function Catalogo() {
  return (
    <section id="productos">
      <div className="section-inner">
        <span className="section-label">Catálogo</span>
        <h2 className="section-title">Nuestros productos</h2>
        <p className="section-sub">
          Todos nuestros productos están elaborados en lienzo de alta calidad. Calculá el precio en el cotizador o
          consultá por WhatsApp haciendo clic en el botón de cada artículo.
        </p>
        <div className="products-grid">
          {productos.map((p) => (
            <ProductCard key={p.nombre} producto={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
