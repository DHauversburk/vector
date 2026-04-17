import { useState, type CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  type EncounterNote,
  type EncounterNoteCategory,
  type EncounterNoteStatus,
} from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { FileText, Search, Filter, Clock, Download, Archive, AlertTriangle } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { toast } from 'sonner'
import { logger } from '../../lib/logger'
import { api } from '../../lib/api'
import { List } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'

// Extracted Components & Hooks
import { useEncounterLogs } from '../../hooks/useEncounterLogs'
import { EncounterRow } from './EncounterRow'
import { BulkArchiveModal } from './BulkArchiveModal'

// ── react-window row-data shape ────────────────────────────────────────────
// index + style are injected by List; everything else comes from rowProps.
type EncounterRowData = {
  notes: EncounterNote[]
  handleStatusChange: (noteId: string, currentStatus: EncounterNoteStatus) => Promise<void>
  handleArchive: (noteId: string) => Promise<void>
  handleUnarchive: (noteId: string) => Promise<void>
}

function EncounterRowRenderer({
  index,
  style,
  notes,
  handleStatusChange,
  handleArchive,
  handleUnarchive,
}: { index: number; style: CSSProperties } & EncounterRowData) {
  return (
    <EncounterRow
      note={notes[index]}
      style={style}
      handleStatusChange={handleStatusChange}
      handleArchive={handleArchive}
      handleUnarchive={handleUnarchive}
    />
  )
}
// ────────────────────────────────────────────────────────────────────────────

export function EncounterLogs() {
  const { user } = useAuth()
  const {
    notes,
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
  } = useEncounterLogs()

  // Bulk Archive Local State
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false)
  const [bulkArchiveDate, setBulkArchiveDate] = useState('')
  const [bulkArchiveLoading, setBulkArchiveLoading] = useState(false)

  const onBulkArchiveConfirm = async (date: string) => {
    setBulkArchiveLoading(true)
    try {
      const result = await api.bulkArchiveNotes(date, user?.id)
      if (result.archivedCount > 0) {
        toast.success(`Archived ${result.archivedCount} note${result.archivedCount > 1 ? 's' : ''}`)
        loadNotes()
      } else {
        toast.info('No notes found before the selected date')
      }
      setShowBulkArchiveModal(false)
      setBulkArchiveDate('')
    } catch (err) {
      logger.error('EncounterLogs', 'Failed to bulk archive', err)
      toast.error('Failed to archive notes')
    } finally {
      setBulkArchiveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <Clock className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
          Retrieving Clinical Records...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Active Notes" value={stats.activeCount} color="blue" />
        <StatCard
          icon={AlertTriangle}
          label="Needs Action"
          value={stats.actionRequiredCount}
          color="amber"
        />
        <StatCard icon={Archive} label="Archived" value={stats.archivedCount} color="slate" />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search logs by patient or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-slate-950"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-3 h-11 rounded-lg border transition-all ${
              showArchived
                ? 'bg-slate-800 border-slate-600 text-white shadow-lg shadow-slate-900/20'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {showArchived ? 'Showing All' : 'Show Archived'}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 h-11">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as EncounterNoteCategory | 'all')}
              className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="question">Questions</option>
              <option value="counseling">Counseling</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="reschedule">Reschedules</option>
              <option value="follow_up">Follow-ups</option>
              <option value="administrative">Admin</option>
            </select>
          </div>

          <Button onClick={exportLogs} variant="outline" size="sm" className="h-11 px-4">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button
            onClick={() => setShowBulkArchiveModal(true)}
            variant="outline"
            size="sm"
            className="h-11 px-4 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            <Archive className="w-4 h-4 mr-2" />
            Bulk Archive
          </Button>
        </div>
      </div>

      {/* Virtualized Notes List */}
      <div className="grid grid-cols-1 gap-4">
        {notes.length === 0 ? (
          <EmptyState showArchived={showArchived} />
        ) : (
          <div className="h-[600px] w-full border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <AutoSizer
              renderProp={({
                height,
                width,
              }: {
                height: number | undefined
                width: number | undefined
              }) => {
                if (height === undefined || width === undefined) return null
                return (
                  <List<EncounterRowData>
                    style={{ height, width }}
                    rowCount={notes.length}
                    rowHeight={165}
                    rowProps={{
                      notes,
                      handleStatusChange,
                      handleArchive,
                      handleUnarchive,
                    }}
                    rowComponent={EncounterRowRenderer}
                  />
                )
              }}
            />
          </div>
        )}
      </div>

      <BulkArchiveModal
        isOpen={showBulkArchiveModal}
        onClose={() => setShowBulkArchiveModal(false)}
        onConfirm={onBulkArchiveConfirm}
        loading={bulkArchiveLoading}
        date={bulkArchiveDate}
        setDate={setBulkArchiveDate}
      />
    </div>
  )
}

// Internal Helper Components
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: number
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    slate: 'bg-slate-500/10 text-slate-500',
  }
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ showArchived }: { showArchived: boolean }) {
  return (
    <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">
        No Clinical Records Found
      </h3>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider max-w-xs mx-auto">
        {showArchived
          ? 'Adjust your search or category filters to locate specific entries.'
          : 'Your clinical history is empty. New encounter notes will appear here automatically.'}
      </p>
    </div>
  )
}
