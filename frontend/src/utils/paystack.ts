const PAYSTACK_SCRIPT_ID = 'paystack-js'
const PAYSTACK_SRC = 'https://js.paystack.co/v1/inline.js'

let paystackLoader: Promise<Window['PaystackPop']> | null = null

export interface PaystackSetupConfig {
  key: string
  email: string
  amount: number
  ref: string
  currency: string
  onClose: () => void
  callback: (response: { reference: string }) => void
}

export async function loadPaystack(): Promise<Window['PaystackPop']> {
  if (typeof window === 'undefined') {
    throw new Error('Paystack can only be loaded in the browser')
  }

  if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
    return window.PaystackPop
  }

  if (paystackLoader) {
    return paystackLoader
  }

  const existingScript = document.getElementById(PAYSTACK_SCRIPT_ID) as HTMLScriptElement | null

  paystackLoader = new Promise<Window['PaystackPop']>((resolve, reject) => {
    const finish = () => {
      if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
        resolve(window.PaystackPop)
      } else {
        reject(new Error('Paystack script loaded but PaystackPop is unavailable'))
      }
    }

    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        finish()
        return
      }

      existingScript.addEventListener('load', () => {
        existingScript.setAttribute('data-loaded', 'true')
        finish()
      }, { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Paystack script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = PAYSTACK_SCRIPT_ID
    script.src = PAYSTACK_SRC
    script.async = true
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      finish()
    }
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })

  return paystackLoader
}

export function isPaystackAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.PaystackPop && typeof window.PaystackPop.setup === 'function'
}
