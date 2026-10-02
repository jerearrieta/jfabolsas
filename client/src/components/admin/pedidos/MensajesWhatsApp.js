import Modal, { Acciones } from '../Modal';
import { buscarCliente, detalleItems, saldoPedido, totalPedido } from '@/lib/negocio';
import { fechaCorta, pesos } from '@/lib/formato';
import { linkCliente } from '@/lib/whatsapp';

// Mensajes armados para mandarle al cliente con un toque.
export default function MensajesWhatsApp({ state, pedido: o, onClose }) {
  const c = buscarCliente(state, o.clientId);
  const saldo = saldoPedido(o);
  const nombre = c?.name.split(' ')[0] || '';
  const mensajes = [
    [
      'Pedido listo',
      `Hola ${nombre}! Tu pedido (${detalleItems(o)}) ya está listo para retirar.${saldo > 0 ? ` Te queda un saldo de ${pesos(saldo)}.` : ''} Gracias!`,
    ],
    ['Recordar saldo', `Hola ${nombre}! Te recuerdo que del pedido (${detalleItems(o)}) queda un saldo de ${pesos(saldo)}. Gracias!`],
    [
      'Confirmar pedido',
      `Hola ${nombre}! Te confirmo el pedido: ${detalleItems(o)}. Total ${pesos(totalPedido(o))}.${o.dueDate ? ` Entrega estimada: ${fechaCorta(o.dueDate)}.` : ''} Gracias!`,
    ],
  ];

  return (
    <Modal onClose={onClose}>
      <h2>Mensaje para {c?.name}</h2>
      {!c?.phone && <p className="aviso">Este cliente no tiene teléfono cargado; WhatsApp te va a pedir elegir el contacto.</p>}
      <div className="wa-list">
        {mensajes.map(([titulo, texto]) => (
          <a
            key={titulo}
            className="wa-msg"
            target="_blank"
            rel="noopener"
            href={c?.phone ? linkCliente(c.phone, texto) : `https://wa.me/?text=${encodeURIComponent(texto)}`}
          >
            <b>{titulo}</b>
            <span>{texto}</span>
          </a>
        ))}
      </div>
      <Acciones onClose={onClose} textoOk={null} />
    </Modal>
  );
}
