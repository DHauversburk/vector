import { format, parseISO } from 'date-fns'
import {
  FileText,
  MessageSquare,
  UserCheck,
  Calendar,
  Settings,
  HelpCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  ArchiveRestore,
  Archive,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { type EncounterNote, type EncounterNoteStatus } from '../../lib/api'
import { Badge } from '../ui/Badge'

export const categoryIcons: Record<string, LucideIcon> = {
  question: MessageSquare,
  counseling: UserCheck,
  reschedule: Calendar,
  follow_up: FileText,
  routine: Clock,
  urgent: AlertTriangle,
  administrative: Settings,
  other: HelpCircle,
}

export const categoryColors: Record<string, string> = {
  question: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  counseling: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  reschedule: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  follow_up: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  routine: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  urgent: 'text-red-500 bg-red-500/10 border-red-500/20',
  administrative: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  other: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
}

export const statusIcons: Record<string, LucideIcon> = {
  active: Clock,
  requires_action: AlertTriangle,
  resolved: CheckCircle,
}

interface EncounterRowProps {
  note: EncounterNote
  style?: React.CSSProperties
  handleStatusChange: (id: string, current: EncounterNoteStatus) => void
  handleArchive: (id: string) => void
  handleUnarchive: (id: string) => void
}

export function EncounterRow({
  note,
  style,
  handleStatusChange,
  handleArchive,
  handleUnarchive,
}: EncounterRowProps) {
  const Icon = categoryIcons[note.category] || FileText
  const colors = categoryColors[note.category] || categoryColors.other
  const StatusIcon = statusIcons[note.status] || Clock
  const isArchived = note.archived

  return (
    <div style={style} className="p-2">
      <div
        className={`h-full group relative bg-white dark:bg-slate-900 rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-center ${isArchived ? 'border-slate-300 dark:border-slate-700 opacity-60' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'}`}
      >
        <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4 h-full">
          <div
            className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${colors}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 lg:gap-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] lg:max-w-none">
                  {note.member_name || 'Anonymous Patient'}
                </h4>
                {isArchived && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-slate-400/30 bg-slate-400/10 hidden lg:inline-flex"
                  >
                    Archived
                  </Badge>
                )}
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden lg:block"></span>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(note.created_at), 'MMM dd, HH:mm')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-black uppercase tracking-widest ${colors} hidden sm:inline-flex`}
                >
                  {note.category.replace('_', ' ')}
                </Badge>
                {!isArchived && (
                  <button
                    onClick={() => handleStatusChange(note.id, note.status)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all hover:scale-105 active:scale-95 ${note.status === 'requires_action' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : note.status === 'resolved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-500'}`}
                    title="Click to cycle status"
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase hidden sm:inline">
                      {note.status === 'requires_action' ? 'Action' : note.status}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <p
              className={`text-xs leading-relaxed font-medium line-clamp-2 ${isArchived ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {note.content}
            </p>
            <div className="pt-2 flex items-center gap-4 mt-auto">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <User className="w-3 h-3" />
                ID: {note.member_id.split('-')[0]}...
              </div>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isArchived ? (
                  <button
                    onClick={() => handleUnarchive(note.id)}
                    className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                  >
                    <ArchiveRestore className="w-3 h-3" />
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchive(note.id)}
                    className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                  >
                    <Archive className="w-3 h-3" />
                    Archive
                  </button>
                )}
                <span className="w-px h-3 bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
                <button className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                  Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Status stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${isArchived ? 'bg-slate-400' : colors.split(' ')[0].replace('text-', 'bg-')}`}
        ></div>
      </div>
    </div>
  )
}
