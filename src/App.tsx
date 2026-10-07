import { useMemo, useState } from 'react'
import './App.css'

const PRODUCTS = [
  { id: 'queso', name: 'Tigrillo de Queso', price: 3.5, weight: '400 g' },
  { id: 'chicharron', name: 'Tigrillo de Chicharrón', price: 3.5, weight: '400 g' },
  { id: 'mixto', name: 'Tigrillo Mixto', price: 4.0, weight: '400 g' },
  { id: 'estudiantil', name: 'Tigrillo Estudiantil', price: 2.0, weight: '200 g' },
] as const

type ProductId = (typeof PRODUCTS)[number]['id']

const EXTRA_NAME = 'Extra seco de carne'
const EXTRA_PRICE = 1.0
const MAX_QTY = 20

const ZONES = [
  { id: 'norte', label: 'Norte de Quito', price: 1.5 },
  { id: 'valles', label: 'Valles', price: 3.0 },
  { id: 'sur', label: 'Sur de Quito', price: 3.0 },
  { id: 'no-aplica', label: 'No aplica', price: 0 },
] as const

type ZoneId = (typeof ZONES)[number]['id']

const DELIVERY_DAYS = [
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
] as const

// Disponibilidad de días de entrega. Cambia a `true` para reactivar un día.
const DELIVERY_DAY_AVAILABILITY: Record<(typeof DELIVERY_DAYS)[number]['id'], boolean> = {
  viernes: true,
  sabado: false,
  domingo: false,
}

type DeliveryDayId = (typeof DELIVERY_DAYS)[number]['id']

const WHATSAPP_NUMBER = '593987249049' // 0987249049 en formato internacional Ecuador
const BANK_ACCOUNT_NUMBER = '5463560900'

const SHEETS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzVEy_tanimeo47m6vpcF8sAlNb4jU-3wo3RWf9_aqLY6ka1Yz0tAPNinxxi7HHsF97/exec'
const SHEETS_TOKEN = 'DELIVERDE_2026_PEDIDOS'
const GOOGLE_MAPS_URL = 'https://www.google.com/maps'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function registrarPedidoEnSheets(payload: Record<string, unknown>) {
  // No-cors + text/plain evita el preflight de CORS en Apps Script; no se espera respuesta
  try {
    fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silencioso: el pedido por WhatsApp no debe verse afectado
    })
  } catch {
    // Silencioso: el pedido por WhatsApp no debe verse afectado
  }
}

function App() {
  const [cantidades, setCantidades] = useState<Record<ProductId, number>>({
    queso: 0,
    chicharron: 0,
    mixto: 0,
    estudiantil: 0,
  })
  const [extraSecoCantidad, setExtraSecoCantidad] = useState(0)
  const [zona, setZona] = useState<ZoneId | ''>('')
  const [diaEntrega, setDiaEntrega] = useState<DeliveryDayId | ''>('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [copiado, setCopiado] = useState(false)

  const zonaSeleccionada = ZONES.find((z) => z.id === zona)
  const diaEntregaSeleccionado = DELIVERY_DAYS.find((day) => day.id === diaEntrega)

  const lineasProductos = useMemo(
    () =>
      PRODUCTS.filter((p) => cantidades[p.id] > 0).map((p) => ({
        name: p.name,
        weight: p.weight,
        cantidad: cantidades[p.id],
        total: p.price * cantidades[p.id],
      })),
    [cantidades],
  )
  const totalTigrillos = lineasProductos.reduce((acc, l) => acc + l.cantidad, 0)
  const extraSecoTotal = EXTRA_PRICE * extraSecoCantidad
  const subtotal = lineasProductos.reduce((acc, l) => acc + l.total, 0) + extraSecoTotal
  const delivery = zonaSeleccionada?.price ?? 0
  const total = subtotal + delivery

  const datosCompletos =
    subtotal > 0 &&
    nombre.trim() !== '' &&
    telefono.trim() !== '' &&
    direccion.trim() !== '' &&
    zona !== '' &&
    diaEntrega !== ''

  const ubicacionUrl = /^https?:\/\//i.test(ubicacion.trim()) ? ubicacion.trim() : ''

  const handleCantidadProducto = (id: ProductId, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [id]: Math.min(MAX_QTY, Math.max(0, prev[id] + delta)),
    }))
  }

  const handleCantidadExtra = (delta: number) => {
    setExtraSecoCantidad((prev) => Math.min(MAX_QTY, Math.max(0, prev + delta)))
  }

  const handleCopiarCuenta = async () => {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT_NUMBER)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  const buildWhatsappMessage = () => {
    const lines = [
      '🌿 NUEVO PEDIDO DELIVERDE',
      '',
      'Productos:',
      ...lineasProductos.map(
        (l) => `${l.name} (${l.weight}) × ${l.cantidad} = ${formatMoney(l.total)}`,
      ),
      ...(extraSecoCantidad > 0
        ? [`${EXTRA_NAME} × ${extraSecoCantidad} = ${formatMoney(extraSecoTotal)}`]
        : []),
      `Día de entrega: ${diaEntregaSeleccionado?.label ?? ''}`,
      '',
      `Subtotal: ${formatMoney(subtotal)}`,
      `Delivery: ${formatMoney(delivery)}`,
      `TOTAL: ${formatMoney(total)}`,
      '',
      'Datos del cliente:',
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Zona: ${zonaSeleccionada?.label ?? ''}`,
      `Dirección de entrega: ${direccion}`,
      `Ubicación: ${ubicacion.trim() || '-'}`,
      `Referencia: ${referencia || '-'}`,
      '',
      'Método de pago: Transferencia Banco Pichincha',
      '',
      'Enviaré el comprobante de transferencia por este chat.',
    ]
    return lines.join('\n')
  }

  const handleConfirmarPedido = () => {
    registrarPedidoEnSheets({
      token: SHEETS_TOKEN,
      nombre,
      telefono,
      direccion,
      ubicacionGoogleMaps: ubicacion.trim(),
      referencia,
      diaEntrega: diaEntregaSeleccionado?.label ?? '',
      producto: [
        ...lineasProductos.map((l) => `${l.name} × ${l.cantidad}`),
        ...(extraSecoCantidad > 0 ? [`${EXTRA_NAME} × ${extraSecoCantidad}`] : []),
      ].join(' | '),
      peso: lineasProductos.map((l) => `${l.weight} × ${l.cantidad}`).join(' | '),
      cantidad: totalTigrillos,
      extraSecoCantidad,
      items: lineasProductos.map((l) => ({
        producto: l.name,
        peso: l.weight,
        cantidad: l.cantidad,
        total: l.total,
      })),
      zona: zonaSeleccionada?.label ?? '',
      delivery,
      subtotal,
      total,
    })

    const mensaje = encodeURIComponent(buildWhatsappMessage())
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header__brand">
          <span className="header__logo">🌿</span>
          <span className="header__name">DELIVERDE</span>
        </div>
      </header>

      <section className="hero">
        <p className="hero__eyebrow">Comida artesanal basada en verde</p>
        <h1 className="hero__title">Tu tigrillo favorito, fresco y a domicilio</h1>
        <p className="hero__subtitle">
          Prepara tu pedido en menos de un minuto y confírmalo por WhatsApp.
        </p>
        <a href="#producto" className="hero__cta">
          Hacer mi pedido
        </a>
      </section>

      <main className="content">
        <section id="producto" className="card">
          <h2 className="card__title">1. Elige tus productos</h2>
          <div className="menu">
            {PRODUCTS.map((p) => (
              <div
                key={p.id}
                className={`menu-item ${cantidades[p.id] > 0 ? 'menu-item--active' : ''}`}
              >
                <span className="menu-item__name">{p.name}</span>
                <span className="menu-item__weight">{p.weight}</span>
                <span className="menu-item__price">{formatMoney(p.price)}</span>
                <div className="quantity quantity--inline">
                  <button
                    type="button"
                    className="quantity__btn"
                    onClick={() => handleCantidadProducto(p.id, -1)}
                    disabled={cantidades[p.id] <= 0}
                    aria-label={`Disminuir cantidad de ${p.name}`}
                  >
                    −
                  </button>
                  <span className="quantity__value">{cantidades[p.id]}</span>
                  <button
                    type="button"
                    className="quantity__btn"
                    onClick={() => handleCantidadProducto(p.id, 1)}
                    disabled={cantidades[p.id] >= MAX_QTY}
                    aria-label={`Aumentar cantidad de ${p.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">2. Extra opcional</h2>
          <div className={`extra ${extraSecoCantidad > 0 ? 'extra--active' : ''}`}>
            <span className="extra__label">{EXTRA_NAME}</span>
            <span className="extra__price">{formatMoney(EXTRA_PRICE)}</span>
            <div className="quantity quantity--inline">
              <button
                type="button"
                className="quantity__btn"
                onClick={() => handleCantidadExtra(-1)}
                disabled={extraSecoCantidad <= 0}
                aria-label={`Disminuir cantidad de ${EXTRA_NAME}`}
              >
                −
              </button>
              <span className="quantity__value">{extraSecoCantidad}</span>
              <button
                type="button"
                className="quantity__btn"
                onClick={() => handleCantidadExtra(1)}
                disabled={extraSecoCantidad >= MAX_QTY}
                aria-label={`Aumentar cantidad de ${EXTRA_NAME}`}
              >
                +
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">3. Zona de entrega</h2>
          <div className="zones">
            {ZONES.map((z) => (
              <label
                key={z.id}
                className={`zone ${zona === z.id ? 'zone--active' : ''}`}
              >
                <input
                  type="radio"
                  name="zona"
                  value={z.id}
                  checked={zona === z.id}
                  onChange={() => setZona(z.id)}
                />
                <span className="zone__label">{z.label}</span>
                <span className="zone__price">{formatMoney(z.price)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">4. Día de entrega</h2>
          <div className="zones">
            {DELIVERY_DAYS.map((day) => (
              <label
                key={day.id}
                className={`zone ${diaEntrega === day.id ? 'zone--active' : ''} ${DELIVERY_DAY_AVAILABILITY[day.id] ? '' : 'zone--disabled'}`}
              >
                <input
                  type="radio"
                  name="diaEntrega"
                  value={day.id}
                  checked={diaEntrega === day.id}
                  onChange={() => setDiaEntrega(day.id)}
                  disabled={!DELIVERY_DAY_AVAILABILITY[day.id]}
                  required
                />
                <span className="zone__label">
                  {DELIVERY_DAY_AVAILABILITY[day.id] ? '🟢' : '⚪'} {day.label}
                </span>
                <span className="zone__price">
                  {DELIVERY_DAY_AVAILABILITY[day.id] ? 'Disponible' : 'No disponible esta semana'}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">5. Tus datos</h2>
          <div className="form">
            <label className="field">
              <span className="field__label">Nombre</span>
              <input
                className="field__input"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María Pérez"
              />
            </label>
            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                className="field__input"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 099 999 9999"
              />
            </label>
            <label className="field">
              <span className="field__label">Dirección de entrega</span>
              <input
                className="field__input"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ingresa tu dirección de entrega"
              />
            </label>
            <a
              className="map-btn"
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Elegir ubicación en Google Maps
            </a>
            <label className="field">
              <span className="field__label">Ubicación de Google Maps</span>
              <input
                className="field__input"
                type="url"
                inputMode="url"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Pega aquí el enlace de Google Maps"
              />
            </label>
            <label className="field">
              <span className="field__label">Referencia</span>
              <input
                className="field__input"
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. Casa azul junto a la tienda"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">6. Método de pago</h2>
          <div className="payment">
            <p className="payment__method">Transferencia bancaria</p>
            <div className="payment__details">
              <div className="payment__row">
                <span>Banco</span>
                <strong>Banco Pichincha</strong>
              </div>
              <div className="payment__row">
                <span>Tipo</span>
                <strong>Cuenta Transaccional</strong>
              </div>
              <div className="payment__row">
                <span>Número</span>
                <strong>{BANK_ACCOUNT_NUMBER}</strong>
              </div>
              <div className="payment__row">
                <span>Titular</span>
                <strong>Paulo Román</strong>
              </div>
            </div>
            <button type="button" className="payment__copy" onClick={handleCopiarCuenta}>
              Copiar número de cuenta
            </button>
            {copiado && (
              <p className="payment__confirm">✓ Número de cuenta copiado</p>
            )}
          </div>
        </section>

        <section className="card card--summary">
          <h2 className="card__title">7. Resumen</h2>
          <div className="summary">
            <div className="summary__row">
              <span>Día de entrega</span>
              <span>{diaEntregaSeleccionado?.label ?? '—'}</span>
            </div>
            <div className="summary__row">
              <span>Dirección de entrega</span>
              <span>{direccion.trim() || '—'}</span>
            </div>
            <div className="summary__row">
              <span>Ubicación</span>
              <span>
                {ubicacionUrl ? (
                  <a
                    className="map-btn map-btn--small"
                    href={ubicacionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📍 Ver ubicación
                  </a>
                ) : (
                  ubicacion.trim() || '—'
                )}
              </span>
            </div>
            {lineasProductos.map((l) => (
              <div className="summary__row" key={l.name}>
                <span>
                  {l.name} × {l.cantidad}
                </span>
                <span>{formatMoney(l.total)}</span>
              </div>
            ))}
            {extraSecoCantidad > 0 && (
              <div className="summary__row">
                <span>
                  {EXTRA_NAME} × {extraSecoCantidad}
                </span>
                <span>{formatMoney(extraSecoTotal)}</span>
              </div>
            )}
            <div className="summary__row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="summary__row">
              <span>Delivery</span>
              <span>
                {zonaSeleccionada
                  ? zonaSeleccionada.id === 'no-aplica'
                    ? `No aplica (${formatMoney(delivery)})`
                    : formatMoney(delivery)
                  : '—'}
              </span>
            </div>
            <div className="summary__row summary__row--total">
              <span>TOTAL</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <button
            type="button"
            className="whatsapp-btn"
            onClick={handleConfirmarPedido}
            disabled={!datosCompletos}
          >
            CONFIRMAR PEDIDO POR WHATSAPP
          </button>
          {!datosCompletos && (
            <p className="summary__hint">
              Elige al menos un producto, el día de entrega y completa tu zona, nombre, teléfono y dirección para continuar.
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>DELIVERDE · Comida artesanal basada en verde</p>
        <p>Pedidos por WhatsApp: 098 724 9049</p>
      </footer>
    </div>
  )
}

export default App
