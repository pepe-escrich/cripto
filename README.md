# Crypto Analyzer - Aplicación de Análisis de Criptomonedas

Una aplicación web completa de análisis de criptomonedas optimizada para dispositivos móviles, construida con Angular.

## 🚀 Características

### 📊 Módulo 1: Analizador de Gráficas
- Gráficos de velas japonesas (candlestick) interactivos con TradingView Lightweight Charts
- Selector de pares de trading (BTC, ETH, SOL, BNB, LINK, TRX vs USDT) + opción custom
- Múltiples timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
- Auto-refresco configurable: 5s, 10s, 30s, 60s, manual
- **Indicadores Técnicos:**
  - RSI (Relative Strength Index) con niveles de sobrecompra/sobreventa
  - FRVP (Fixed Range Volume Profile) de largo y corto plazo
  - Detección automática de divergencias alcistas y bajistas
- Estadísticas de 24h (precio, cambio porcentual, volumen)

### 🧮 Módulo 2: Calculadora de Apalancamiento
- Cálculo preciso de precio de liquidación
- Estructura completa de comisiones BingX:
  - Comisión de apertura: 0.02% (maker) / 0.04% (taker)
  - Comisión de cierre: 0.02% (maker) / 0.04% (taker)
  - Funding rate: cálculo cada 8 horas
- Cálculo de ROI porcentual
- Ganancia/pérdida neta después de comisiones
- Indicador visual de nivel de riesgo
- Soporte para posiciones Long y Short
- Apalancamiento de 1x a 125x

### 🎯 Módulo 3: Setup de Órdenes
- Gestión profesional de riesgo
- Cálculo automático de:
  - Apalancamiento óptimo basado en % de riesgo
  - Tamaño de posición recomendado
  - Stop Loss y Take Profit óptimos
  - Precio de liquidación
  - Ratio Reward:Risk visual
- Sugerencias de setup personalizadas
- Precios en tiempo real desde Binance API
- Función de copiar setup al portapapeles
- Tips y mejores prácticas de trading

## 🛠️ Tecnologías

- **Framework:** Angular 20.3
- **Gráficos:** TradingView Lightweight Charts
- **API de datos:** Binance Public API
- **Diseño:** SCSS con tema oscuro mobile-first
- **HTTP Client:** Angular HttpClient con RxJS

## 📱 Diseño Mobile-First

La aplicación está completamente optimizada para uso en smartphones:
- Navegación inferior tipo app móvil
- Controles táctiles grandes y accesibles
- Responsive design para tablets y desktop
- Modo landscape optimizado para gráficos
- Tema oscuro predeterminado (reduce fatiga visual)

## 🚦 Instalación y Uso

### Requisitos previos
- Node.js 18+
- npm 9+

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve

# La aplicación estará disponible en http://localhost:4200
```

### Build para producción

```bash
# Crear build de producción
ng build --configuration production

# Los archivos de build estarán en dist/
```

## 🌐 Despliegue en Vercel

La aplicación está configurada para desplegarse fácilmente en Vercel:

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Sube tu código a GitHub** (si aún no lo has hecho)

2. **Ve a [Vercel](https://vercel.com)** y crea una cuenta o inicia sesión

3. **Importa tu proyecto:**
   - Click en "Add New Project"
   - Selecciona tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Angular

4. **Configura el proyecto:**
   - Framework Preset: **Angular**
   - Build Command: `npm run vercel-build` (ya configurado)
   - Output Directory: `dist/crypto-analyzer/browser` (ya configurado en vercel.json)

5. **Deploy:** Click en "Deploy" y espera unos minutos

6. **¡Listo!** Tu app estará disponible en una URL como `https://crypto-analyzer.vercel.app`

### Opción 2: Despliegue desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login en Vercel
vercel login

# Desplegar (primera vez)
vercel

# Desplegar a producción
vercel --prod
```

### Configuración incluida

El proyecto ya incluye:
- ✅ `vercel.json` - Configuración de rutas para Angular SPA
- ✅ `.vercelignore` - Archivos a ignorar en el despliegue
- ✅ `vercel-build` script en package.json

### Variables de entorno (opcional)

Si necesitas variables de entorno, créalas en Vercel:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las variables necesarias

### Actualizaciones automáticas

Una vez conectado a GitHub:
- Cada push a la rama principal desplegará automáticamente
- Los pull requests crearán preview deployments
- Rollback instantáneo desde el dashboard de Vercel

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── chart-analyzer/          # Módulo de análisis de gráficas
│   │   ├── leverage-calculator/     # Calculadora de apalancamiento
│   │   ├── order-setup/             # Setup de órdenes
│   │   └── navigation/              # Navegación inferior
│   ├── services/
│   │   ├── crypto-data.service.ts         # Servicio de API
│   │   ├── technical-indicators.service.ts # Indicadores técnicos
│   │   └── leverage-calculator.service.ts  # Cálculos de apalancamiento
│   ├── models/
│   │   └── trading.models.ts        # Modelos de datos TypeScript
│   ├── app.ts                       # Componente principal
│   ├── app.routes.ts                # Configuración de rutas
│   └── app.config.ts                # Configuración de la app
├── styles.scss                      # Estilos globales
└── index.html                       # HTML principal
```

## 🎨 Paleta de Colores

- **Fondo primario:** #0d0d0d
- **Fondo secundario:** #1a1a1a
- **Texto principal:** #ffffff
- **Texto secundario:** #d1d4dc
- **Acento azul:** #4a9eff
- **Verde (alcista):** #26a69a
- **Rojo (bajista):** #ef5350
- **Naranja (advertencia):** #ff9800

## 📊 Fuente de Datos

La aplicación utiliza la API pública de Binance para obtener:
- Datos históricos de velas (klines)
- Precios en tiempo real
- Estadísticas de 24 horas
- Volumen de trading

**Nota:** No se requiere API key para las funciones básicas.

## ⚠️ Disclaimer

Esta aplicación es solo para fines educativos y de análisis. No constituye asesoramiento financiero. El trading con apalancamiento conlleva riesgos significativos. Siempre haz tu propia investigación y nunca inviertas más de lo que puedes permitirte perder.

## 🔄 Próximas Mejoras

- [ ] Alertas de precio personalizables
- [ ] Historial de trades simulados
- [ ] Más pares de trading de diferentes exchanges
- [ ] Backtesting de estrategias
- [ ] Integración con múltiples exchanges
- [ ] Modo claro (light mode)
- [ ] Exportar análisis a PDF
- [ ] Notificaciones push para divergencias
- [ ] Soporte para más indicadores técnicos (MACD, Bollinger Bands, etc.)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con Angular y TypeScript.

---

**Happy Trading! 🚀📈**
