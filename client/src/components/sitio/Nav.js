const links = [
  ['#inicio', 'Inicio'],
  ['#productos', 'Productos'],
  ['#cotizador', 'Cotizá'],
  ['#pedido-especial', 'A medida'],
  ['#contacto', 'Contacto'],
];

export default function Nav() {
  return (
    <nav>
      <div className="nav-logo">
        JFA <span>Bolsas</span>
      </div>
      <ul className="nav-links">
        {links.map(([href, texto]) => (
          <li key={href}>
            <a href={href}>{texto}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
