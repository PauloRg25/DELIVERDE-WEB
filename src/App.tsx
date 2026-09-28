import { useMemo, useState } from 'react'
import './App.css'

const PRODUCT_PRICE = 4.0
const PRODUCT_NAME = 'Tigrillo Mixto'

const ZONES = [
  { id: 'norte', label: 'Norte de Quito', price: 1.5 },
  { id: 'valles', label: 'Valles', price: 3.0 },
  { id: 'sur', label: 'Sur de Quito', price: 3.0 },
] as const

type ZoneId = (typeof ZONES)[number]['id']

const WHATSAPP_NUMBER = '593987249049' // 0987249049 en formato internacional Ecuador
const BANK_ACCOUNT_NUMBER = '5463560900'

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function App() {
  const [conQueso, setConQueso] = useState(true)
  const [conChicharron, setConChicharron] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [zona, setZona] = useState<ZoneId | ''>('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [copiado, setCopiado] = useState(false)

  const zonaSeleccionada = ZONES.find((z) => z.id === zona)

  const subtotal = useMemo(() => PRODUCT_PRICE * cantidad, [cantidad])
  const delivery = zonaSeleccionada?.price ?? 0
  const total = subtotal + delivery

  const datosCompletos =
    nombre.trim() !== '' &&
    telefono.trim() !== '' &&
    direccion.trim() !== '' &&
    zona !== ''

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
      `Producto: ${PRODUCT_NAME}`,
      `Cantidad: ${cantidad}`,
      `Queso: ${conQueso ? 'Con queso' : 'Sin queso'}`,
      `Chicharrón: ${conChicharron ? 'Con chicharrón' : 'Sin chicharrón'}`,
      '',
      `Subtotal: ${formatMoney(subtotal)}`,
      `Delivery: ${formatMoney(delivery)}`,
      `TOTAL: ${formatMoney(total)}`,
      '',
      `Cliente: ${nombre}`,
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
        <h1 className="hero__title">Tu Tigrillo Mixto, fresco y a domicilio</h1>
        <p className="hero__subtitle">
          Prepara tu pedido en menos de un minuto y confírmalo por WhatsApp.
        </p>
        <a href="#producto" className="hero__cta">
          Hacer mi pedido
        </a>
      </section>

      <main className="content">
        <section id="producto" className="card">
          <h2 className="card__title">1. Producto</h2>
          <div className="product">
            <div className="product__info">
              <h3 className="product__name">{PRODUCT_NAME}</h3>
              <p className="product__desc">
                Nuestro clásico tigrillo artesanal, servido bien caliente.
              </p>
            </div>
            <span className="product__price">{formatMoney(PRODUCT_PRICE)}</span>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">2. Personaliza tu pedido</h2>
          <div className="options">
            <div className="option-group">
              <span className="option-group__label">Queso</span>
              <div className="toggle">
                <button
                  type="button"
                  className={`toggle__btn ${conQueso ? 'toggle__btn--active' : ''}`}
                  onClick={() => setConQueso(true)}
                >
                  Con queso
                </button>
                <button
                  type="button"
                  className={`toggle__btn ${!conQueso ? 'toggle__btn--active' : ''}`}
                  onClick={() => setConQueso(false)}
                >
                  Sin queso
                </button>
              </div>
            </div>

            <div className="option-group">
              <span className="option-group__label">Chicharrón</span>
              <div className="toggle">
                <button
                  type="button"
                  className={`toggle__btn ${conChicharron ? 'toggle__btn--active' : ''}`}
                  onClick={() => setConChicharron(true)}
                >
                  Con chicharrón
                </button>
                <button
                  type="button"
                  className={`toggle__btn ${!conChicharron ? 'toggle__btn--active' : ''}`}
                  onClick={() => setConChicharron(false)}
                >
                  Sin chicharrón
                </button>
              </div>
            </div>
          </div>
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
              <span>Producto</span>
              <span>{PRODUCT_NAME}</span>
            </div>
            <div className="summary__row">
              <span>Personalización</span>
              <span>
                {conQueso ? 'Con queso' : 'Sin queso'},{' '}
                {conChicharron ? 'Con chicharrón' : 'Sin chicharrón'}
              </span>
            </div>
            <div className="summary__row">
              <span>Cantidad</span>
              <span>{cantidad}</span>
            </div>
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
              Completa tu zona de entrega, nombre, teléfono y dirección para continuar.
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
