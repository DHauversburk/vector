import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  api,
  type EncounterNote,
  type EncounterNoteCategory,
  type EncounterNoteStatus,
} from '../lib/api'
import { useAuth } from './useAuth'
import { logger } from '../lib/logger'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function useEncounterLogs() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<EncounterNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<EncounterNoteCategory | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await api.getProviderEncounterNotes(500, showArchived)
      setNotes(data)
    } catch (err) {
      logger.error('useEncounterLogs', 'Failed to load encounter logs', err)
      toast.error('Failed to load clinical logs')
    } finally {
      setLoading(false)
    }
  }, [user, showArchived])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const handleArchive = async (noteId: string) => {
    try {
      await api.archiveNote(noteId)
      toast.success('Note archived')
      loadNotes()
    } catch (err) {
      logger.error('useEncounterLogs', 'Failed to archive note', err)
      toast.error('Failed to archive note')
    }
  }

  const handleUnarchive = async (noteId: string) => {
    try {
      await api.unarchiveNote(noteId)
      toast.success('Note restored')
      loadNotes()
    } catch (err) {
      logger.error('useEncounterLogs', 'Failed to restore note', err)
      toast.error('Failed to restore note')
    }
  }

  const handleStatusChange = async (noteId: string, currentStatus: EncounterNoteStatus) => {
    const statusCycle: EncounterNoteStatus[] = ['active', 'requires_action', 'resolved']
    const currentIndex = statusCycle.indexOf(currentStatus)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

    try {
      await api.updateNoteStatus(noteId, nextStatus)
      const statusLabels = {
        active: 'Active',
        requires_action: 'Needs Action',
        resolved: 'Resolved',
      }
      toast.success(`Status updated to ${statusLabels[nextStatus]}`)
      loadNotes()
    } catch (err) {
      logger.error('useEncounterLogs', 'Failed to update status', err)
      toast.error('Failed to update status')
    }
  }

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.member_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filter === 'all' || note.category === filter
      return matchesSearch && matchesFilter
    })
  }, [notes, searchTerm, filter])

  const stats = useMemo(
    () => ({
      activeCount: notes.filter((n) => !n.archived).length,
      archivedCount: notes.filter((n) => n.archived).length,
      actionRequiredCount: notes.filter((n) => n.status === 'requires_action' && !n.archived)
        .length,
    }),
    [notes],
  )

  const exportLogs = () => {
    const data = JSON.stringify(filteredNotes, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `encounter-logs-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    toast.success('Logs exported successfully')
  }

  return {
    notes: filteredNotes,
    loading,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    showArchived,
    setShowArchived,
    stats,
    loadNotes,
    handleArchive,
    handleUnarchive,
    handleStatusChange,
    exportLogs,
  }
}
