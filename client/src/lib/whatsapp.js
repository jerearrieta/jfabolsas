import { WHATSAPP } from './config';

// Link para escribirle al negocio con un mensaje ya escrito.
export function linkNegocio(texto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// Link para que el negocio le escriba a un cliente. Acepta números locales de Córdoba.
export function linkCliente(telefono, texto) {
  let d = String(telefono || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '549' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}
