import { supabase } from '../../supabase'
import { IS_MOCK } from '../../supabase'
import type { IAuthActions } from '../interfaces'
import type { MFAFactor } from '../types'

/**
 * Hashes a PIN string using SHA-256 via the Web Crypto API.
 */
async function hashPin(pin: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    let hash = 0
    const combined = `VECTOR_SALT_${pin}`
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return `fallback_${Math.abs(hash).toString(16)}`
  }
}

/**
 * Supabase auth actions.
 * In LIVE mode, PINs are stored in the `user_pins` table via Supabase.
 * In MOCK mode, PINs fall back to localStorage.
 */
export const supabaseAuth: IAuthActions = {
  setTacticalPin: async (userId: string, pin: string): Promise<void> => {
    const hashed = await hashPin(pin)

    if (IS_MOCK) {
      localStorage.setItem(`TACTICAL_PIN_${userId}`, hashed)
      return
    }

    const { error } = await supabase.from('user_pins').upsert(
      {
        user_id: userId,
        pin_hash: hashed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      // Fallback to localStorage if DB fails
      console.warn('PIN save to Supabase failed, falling back to localStorage', error)
      localStorage.setItem(`TACTICAL_PIN_${userId}`, hashed)
    }
  },

  getTacticalPin: async (userId: string): Promise<string | null> => {
    if (IS_MOCK) {
      return localStorage.getItem(`TACTICAL_PIN_${userId}`)
    }

    const { data, error } = await supabase
      .from('user_pins')
      .select('pin_hash')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Check localStorage as migration fallback
      return localStorage.getItem(`TACTICAL_PIN_${userId}`)
    }

    return data.pin_hash
  },

  verifyTacticalPin: async (userId: string, pin: string): Promise<boolean> => {
    const inputHash = await hashPin(pin)

    if (IS_MOCK) {
      const storedHash = localStorage.getItem(`TACTICAL_PIN_${userId}`)
      if (!storedHash) return false
      return inputHash === storedHash
    }

    const { data, error } = await supabase
      .from('user_pins')
      .select('pin_hash')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Migration fallback: check localStorage
      const localHash = localStorage.getItem(`TACTICAL_PIN_${userId}`)
      if (localHash && localHash === inputHash) {
        // Auto-migrate to Supabase
        await supabase
          .from('user_pins')
          .upsert(
            { user_id: userId, pin_hash: localHash, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
          )
        localStorage.removeItem(`TACTICAL_PIN_${userId}`)
        return true
      }
      return false
    }

    return data.pin_hash === inputHash
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },

  updateEmail: async (newEmail: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
  },

  enrollMFA: async (): Promise<{ qrCode: string; secret: string; factorId: string }> => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) throw error
    return {
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    }
  },

  verifyMFA: async (factorId: string, code: string): Promise<void> => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (challengeError) throw challengeError
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    })
    if (verifyError) throw verifyError
  },

  unenrollMFA: async (factorId: string): Promise<void> => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) throw error
  },

  listMFAFactors: async (): Promise<MFAFactor[]> => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    return (data.totp ?? []).map((f) => ({
      id: f.id,
      type: 'totp',
      status: f.status as MFAFactor['status'],
      friendly_name: f.friendly_name,
    }))
  },

  signOutOtherSessions: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) throw error
  },
}
