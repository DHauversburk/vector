import { mockStore } from '../mockStore'
import type { Appointment } from '../types'
import type { IAppointmentActions } from '../interfaces'
import { supabase } from '../../supabase'
import { logger } from '../../logger'

export const mockAppointments: IAppointmentActions = {
  getMyAppointments: async (startDate?: string, endDate?: string): Promise<Appointment[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await mockStore.load()

    if (!mockStore.init) {
      await seedInitialData(user.id)
    }

    let myAppts = mockStore.appointments.filter((a) => a.member_id === user.id)
    if (startDate) myAppts = myAppts.filter((a) => a.start_time >= startDate)
    if (endDate) myAppts = myAppts.filter((a) => a.start_time <= endDate)

    return myAppts.map((a) => {
      if (a.provider) return a
      let alias = 'UNKNOWN'
      let st = 'PRIMARY'
      if (a.provider_id.includes('jameson')) {
        alias = 'Dr. Jameson'
        st = 'MH_GREEN'
      } else if (a.provider_id.includes('smith')) {
        alias = 'Dr. Smith'
        st = 'PRIMARY_BLUE'
      } else if (a.provider_id.includes('taylor')) {
        alias = 'Dr. Taylor'
        st = 'PT_GOLD'
      }

      return { ...a, provider: { token_alias: alias, service_type: st } }
    })
  },

  bookSlot: async (slotId: string, notes?: string): Promise<Appointment> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    await mockStore.load()
    if (slotId.startsWith('mock-slot')) {
      let pId = 'mock-provider-jameson'
      let idx = 0

      if (slotId.includes('mock-provider')) {
        const parts = slotId.split('-')
        idx = parseInt(parts.pop() || '0')
        pId = parts.slice(2).join('-')
      } else {
        idx = parseInt(slotId.split('-').pop() || '0')
      }

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      const slotTime = new Date(tomorrow)
      slotTime.setHours(9 + idx)

      const newAppt: Appointment = {
        id: `mock-appt-new-${Date.now()}`,
        provider_id: pId,
        member_id: user.id,
        start_time: slotTime.toISOString(),
        end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        is_booked: true,
        created_at: new Date().toISOString(),
        notes: notes,
        provider: {
          token_alias:
            pId.includes('smith') || pId.includes('blue')
              ? 'Dr. Smith'
              : pId.includes('taylor')
                ? 'Dr. Taylor'
                : 'Dr. Jameson',
          service_type:
            pId.includes('smith') || pId.includes('blue')
              ? 'PRIMARY_BLUE'
              : pId.includes('taylor')
                ? 'PT_GOLD'
                : 'MH_GREEN',
        },
      }

      mockStore.appointments.push(newAppt)
      await mockStore.save()
      mockStore.addNotification({
        user_id: user.id,
        type: 'appointment_booked',
        title: 'Appointment Confirmed',
        body: `Your appointment has been scheduled for ${new Date(newAppt.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
      })
      return newAppt
    }

    const idx = mockStore.appointments.findIndex((a) => a.id === slotId)
    if (idx >= 0) {
      const appt = mockStore.appointments[idx]
      appt.member_id = user.id
      appt.status = 'confirmed'
      appt.is_booked = true
      appt.notes = notes || appt.notes

      if (!appt.provider) {
        const pid = appt.provider_id
        appt.provider = {
          token_alias: pid.includes('smith')
            ? 'Dr. Smith'
            : pid.includes('taylor')
              ? 'Dr. Taylor'
              : 'Dr. Jameson',
          service_type: pid.includes('smith')
            ? 'PRIMARY_BLUE'
            : pid.includes('taylor')
              ? 'PT_GOLD'
              : 'MH_GREEN',
        }
      }

      await mockStore.save()
      mockStore.addNotification({
        user_id: user.id,
        type: 'appointment_booked',
        title: 'Appointment Confirmed',
        body: `Your appointment has been scheduled for ${new Date(appt.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
      })
      return appt
    }
    throw new Error('Mock Appointment Not Found')
  },

  deleteAppointment: async (appointmentId: string): Promise<void> => {
    await mockStore.load()
    const idx = mockStore.appointments.findIndex((a) => a.id === appointmentId)
    if (idx >= 0) {
      mockStore.appointments.splice(idx, 1)
      await mockStore.save()
    }
  },

  cancelAppointment: async (appointmentId: string, reason?: string): Promise<void> => {
    await mockStore.load()
    const idx = mockStore.appointments.findIndex((a) => a.id === appointmentId)
    if (idx >= 0) {
      const appt = mockStore.appointments[idx]
      const memberId = appt.member_id
      appt.status = 'cancelled'
      if (reason) {
        appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`
      }
      await mockStore.save()
      if (memberId) {
        mockStore.addNotification({
          user_id: memberId,
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          body: `Your appointment on ${new Date(appt.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} has been cancelled.`,
        })
      }
    }
  },

  providerCancelAppointment: async (appointmentId: string, reason: string): Promise<void> => {
    await mockStore.load()
    const idx = mockStore.appointments.findIndex((a) => a.id === appointmentId)
    if (idx >= 0) {
      const appt = mockStore.appointments[idx]
      appt.status = 'cancelled'
      appt.notes = (appt.notes || '') + ` | CANCEL_REASON: ${reason}`
      await mockStore.save()
    }
  },

  directBook: async (slotId: string, memberId: string): Promise<Appointment> => {
    await mockStore.load()
    const idx = mockStore.appointments.findIndex((a) => a.id === slotId)
    if (idx >= 0) {
      const updated = {
        ...mockStore.appointments[idx],
        member_id: memberId,
        is_booked: true,
        status: 'confirmed' as const,
        notes: '',
      }
      mockStore.appointments[idx] = updated
      await mockStore.save()
      return updated as Appointment
    }

    if (slotId.startsWith('mock-slot')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      const idx = parseInt(slotId.split('-').pop() || '0')
      const slotTime = new Date(tomorrow)
      slotTime.setHours(9 + idx)

      const newAppt: Appointment = {
        id: `mock-appt-admin-${Date.now()}`,
        provider_id: 'mock-provider-jameson',
        member_id: memberId,
        start_time: slotTime.toISOString(),
        end_time: new Date(slotTime.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        is_booked: true,
        created_at: new Date().toISOString(),
        provider: { token_alias: 'Dr. Jameson', service_type: 'MH_GREEN' },
      }
      mockStore.appointments.push(newAppt)
      await mockStore.save()
      return newAppt
    }
    throw new Error('Mock Appointment Not Found')
  },

  submitFeedback: async (
    _appointmentId: string,
    _rating: number,
    _comment?: string,
  ): Promise<{ success: boolean }> => {
    return { success: true }
  },

  rescheduleAppointmentSwap: async (oldApptId: string, newSlotId: string): Promise<boolean> => {
    await mockStore.load()
    const oldApptIndex = mockStore.appointments.findIndex((a) => a.id === oldApptId)
    if (oldApptIndex === -1) throw new Error('Mock: Old appointment not found')

    const oldAppt = mockStore.appointments[oldApptIndex]
    let newStartTime = new Date().toISOString()

    if (newSlotId.startsWith('mock-slot')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      const idx = parseInt(newSlotId.split('-').pop() || '0')
      const t = new Date(tomorrow)
      t.setHours(9 + idx)
      newStartTime = t.toISOString()
    }

    const newAppt = {
      ...oldAppt,
      id: `mock-appt-resched-${Date.now()}`,
      start_time: newStartTime,
      end_time: new Date(new Date(newStartTime).getTime() + 60 * 60 * 1000).toISOString(),
      status: 'confirmed' as const,
      is_booked: true,
    }

    mockStore.appointments.splice(oldApptIndex, 1)
    mockStore.appointments.push(newAppt)
    await mockStore.save()
    return true
  },

  updateAppointmentStatus: async (
    id: string,
    status: Appointment['status'],
  ): Promise<Appointment> => {
    await mockStore.load()
    const idx = mockStore.appointments.findIndex((a) => a.id === id)
    if (idx >= 0) {
      const isBooked = ['confirmed', 'completed', 'blocked'].includes(status)
      const updated = {
        ...mockStore.appointments[idx],
        status: status,
        is_booked: isBooked,
      }
      mockStore.appointments[idx] = updated
      await mockStore.save()
      return updated as Appointment
    }
    throw new Error('Appointment Not Found')
  },

  getAllAppointments: async (): Promise<Appointment[]> => {
    await mockStore.load()
    return mockStore.appointments
  },

  checkAvailability: async (date: Date): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return true

    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    await mockStore.load()
    return !mockStore.appointments.some(
      (a) =>
        a.member_id === user.id &&
        new Date(a.start_time) >= start &&
        new Date(a.start_time) <= end &&
        a.status !== 'cancelled',
    )
  },

  createAppointment: async (
    appt: Omit<Appointment, 'id' | 'created_at' | 'provider' | 'member'>,
  ): Promise<Appointment> => {
    const newAppt: Appointment = {
      id: `mock-appt-create-${Date.now()}`,
      ...appt,
      is_booked: true,
      created_at: new Date().toISOString(),
      provider: { token_alias: 'Provider', service_type: 'PRIMARY' },
    }
    mockStore.appointments.push(newAppt)
    await mockStore.save()
    return newAppt
  },
}

async function seedInitialData(userId: string) {
  logger.debug('MOCK', 'Seeding initial dataset...')

  const seedAppointments: Appointment[] = []
  const now = new Date()
  const providerIds = [
    { id: 'mock-provider-jameson', alias: 'Dr. Jameson', service: 'MH_GREEN' },
    { id: 'mock-provider-smith', alias: 'Dr. Smith', service: 'PRIMARY_BLUE' },
    { id: 'mock-provider-taylor', alias: 'Dr. Taylor', service: 'PT_GOLD' },
  ]

  for (let i = 1; i <= 5; i++) {
    const pastDate = new Date(now)
    pastDate.setDate(now.getDate() - i * 2)
    pastDate.setHours(10, 0, 0, 0)

    seedAppointments.push({
      id: `mock-appt-past-${i}`,
      provider_id: 'mock-provider-jameson',
      member_id: userId,
      start_time: pastDate.toISOString(),
      end_time: new Date(pastDate.getTime() + 60 * 60 * 1000).toISOString(),
      status: 'completed',
      is_booked: true,
      created_at: pastDate.toISOString(),
      provider: { token_alias: 'Dr. Jameson', service_type: 'MH_GREEN' },
      notes: 'Routine check-up | Location: Mental Health Clinic',
    })
  }

  for (let d = 0; d < 30; d++) {
    const day = new Date(now)
    day.setDate(now.getDate() + d)
    if (day.getDay() === 0 || day.getDay() === 6) continue

    providerIds.forEach((p) => {
      const startHours = [7, 8, 9, 10, 11, 13, 14, 15, 16]
      startHours.forEach((h) => {
        const slotStart = new Date(day)
        slotStart.setHours(h, h === 7 ? 30 : 0, 0, 0)

        if (Math.random() < 0.05) {
          seedAppointments.push({
            id: `mock-block-${p.id}-${d}-${h}`,
            provider_id: p.id,
            member_id: null,
            start_time: slotStart.toISOString(),
            end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
            status: 'blocked',
            is_booked: true,
            created_at: now.toISOString(),
            notes: 'Admin Block',
            provider: { token_alias: p.alias, service_type: p.service },
          })
          return
        }

        if (Math.random() < 0.3) {
          seedAppointments.push({
            id: `mock-booked-${p.id}-${d}-${h}`,
            provider_id: p.id,
            member_id: `other-patient-${Math.floor(Math.random() * 999)}`,
            start_time: slotStart.toISOString(),
            end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            is_booked: true,
            created_at: now.toISOString(),
            provider: { token_alias: p.alias, service_type: p.service },
          })
          return
        }

        seedAppointments.push({
          id: `mock-gen-${p.id}-${d}-${h}`,
          provider_id: p.id,
          member_id: null,
          start_time: slotStart.toISOString(),
          end_time: new Date(slotStart.getTime() + 60 * 60 * 1000).toISOString(),
          status: 'pending',
          is_booked: false,
          created_at: now.toISOString(),
          provider: { token_alias: p.alias, service_type: p.service },
        })
      })
    })
  }

  mockStore.appointments = seedAppointments
  mockStore.init = true
  await mockStore.save()
}
