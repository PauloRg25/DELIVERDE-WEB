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

const ZONES = [
  { id: 'norte', label: 'Norte de Quito', price: 1.5 },
  { id: 'valles', label: 'Valles', price: 3.0 },
  { id: 'sur', label: 'Sur de Quito', price: 3.0 },
] as const

type ZoneId = (typeof ZONES)[number]['id']

const DELIVERY_DAYS = [
  { id: 'sabado', label: 'Sábado 3 de octubre' },
  { id: 'domingo', label: 'Domingo 4 de octubre' },
] as const

type DeliveryDayId = (typeof DELIVERY_DAYS)[number]['id']

const WHATSAPP_NUMBER = '593987249049' // 0987249049 en formato internacional Ecuador
const BANK_ACCOUNT_NUMBER = '5463560900'

const SHEETS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzVEy_tanimeo47m6vpcF8sAlNb4jU-3wo3RWf9_aqLY6ka1Yz0tAPNinxxi7HHsF97/exec'
const SHEETS_TOKEN = 'DELIVERDE_2026_PEDIDOS'

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
  const [productoId, setProductoId] = useState<ProductId>('mixto')
  const [extraSeco, setExtraSeco] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [zona, setZona] = useState<ZoneId | ''>('')
  const [diaEntrega, setDiaEntrega] = useState<DeliveryDayId | ''>('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [copiado, setCopiado] = useState(false)

  const producto = PRODUCTS.find((p) => p.id === productoId)!
  const zonaSeleccionada = ZONES.find((z) => z.id === zona)
  const diaEntregaSeleccionado = DELIVERY_DAYS.find((day) => day.id === diaEntrega)

  const subtotal = useMemo(
    () => (producto.price + (extraSeco ? EXTRA_PRICE : 0)) * cantidad,
    [producto, extraSeco, cantidad],
  )
  const delivery = zonaSeleccionada?.price ?? 0
  const total = subtotal + delivery

  const datosCompletos =
    nombre.trim() !== '' &&
    telefono.trim() !== '' &&
    direccion.trim() !== '' &&
    zona !== '' &&
    diaEntrega !== ''

  const handleCantidad = (delta: number) => {
    setCantidad((prev) => Math.min(20, Math.max(1, prev + delta)))
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
      `Producto: ${producto.name}`,
      `Peso: ${producto.weight}`,
      `Cantidad: ${cantidad}`,
      `Día de entrega: ${diaEntregaSeleccionado?.label ?? ''}`,
      '',
      ...(extraSeco ? [`${EXTRA_NAME}: Sí`, ''] : []),
      `Subtotal: ${formatMoney(subtotal)}`,
      `Delivery: ${formatMoney(delivery)}`,
      `TOTAL: ${formatMoney(total)}`,
      '',
      'Datos del cliente:',
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Zona: ${zonaSeleccionada?.label ?? ''}`,
      `Dirección: ${direccion}`,
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
      referencia,
      diaEntrega: diaEntregaSeleccionado?.label ?? '',
      producto: producto.name,
      peso: producto.weight,
      cantidad,
      extraSecoCarne: extraSeco ? 'Sí' : 'No',
      zona: zonaSeleccionada?.label ?? '',
      delivery,
      subtotal,
      total,
      metodoPago: 'Transferencia Banco Pichincha',
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
          <h2 className="card__title">1. Elige tu tigrillo</h2>
          <div className="menu">
            {PRODUCTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`menu-item ${productoId === p.id ? 'menu-item--active' : ''}`}
                onClick={() => setProductoId(p.id)}
              >
                <span className="menu-item__name">{p.name}</span>
                <span className="menu-item__weight">{p.weight}</span>
                <span className="menu-item__price">{formatMoney(p.price)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">2. Extra opcional</h2>
          <label className={`extra ${extraSeco ? 'extra--active' : ''}`}>
            <input
              type="checkbox"
              checked={extraSeco}
              onChange={(e) => setExtraSeco(e.target.checked)}
            />
            <span className="extra__label">Agregar extra seco de carne</span>
            <span className="extra__price">+{formatMoney(EXTRA_PRICE)}</span>
          </label>
        </section>

        <section className="card">
          <h2 className="card__title">3. Cantidad</h2>
          <div className="quantity">
            <button
              type="button"
              className="quantity__btn"
              onClick={() => handleCantidad(-1)}
              disabled={cantidad <= 1}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="quantity__value">{cantidad}</span>
            <button
              type="button"
              className="quantity__btn"
              onClick={() => handleCantidad(1)}
              disabled={cantidad >= 20}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">4. Zona de entrega</h2>
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
          <h2 className="card__title">5. Día de entrega</h2>
          <div className="zones">
            {DELIVERY_DAYS.map((day) => (
              <label
                key={day.id}
                className={`zone ${diaEntrega === day.id ? 'zone--active' : ''}`}
              >
                <input
                  type="radio"
                  name="diaEntrega"
                  value={day.id}
                  checked={diaEntrega === day.id}
                  onChange={() => setDiaEntrega(day.id)}
                  required
                />
                <span className="zone__label">{day.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">6. Tus datos</h2>
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
              <span className="field__label">Dirección</span>
              <input
                className="field__input"
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, sector"
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
          <h2 className="card__title">7. Método de pago</h2>
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
          <h2 className="card__title">8. Resumen</h2>
          <div className="summary">
            <div className="summary__row">
              <span>Día de entrega</span>
              <span>{diaEntregaSeleccionado?.label ?? '—'}</span>
            </div>
            <div className="summary__row">
              <span>Producto</span>
              <span>{producto.name}</span>
            </div>
            <div className="summary__row">
              <span>Peso</span>
              <span>{producto.weight}</span>
            </div>
            <div className="summary__row">
              <span>Cantidad</span>
              <span>{cantidad}</span>
            </div>
            {extraSeco && (
              <div className="summary__row">
                <span>{EXTRA_NAME}</span>
                <span>Sí</span>
              </div>
            )}
            <div className="summary__row">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="summary__row">
              <span>Delivery</span>
              <span>{zonaSeleccionada ? formatMoney(delivery) : '—'}</span>
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
              Selecciona el día de entrega y completa tu zona, nombre, teléfono y dirección para continuar.
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
