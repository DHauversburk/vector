/**
 * PatientRow — shared patient-directory entry for mobile card and desktop table.
 *
 * The `variant` prop controls whether the component renders as a card `<div>`
 * (mobile) or a `<tr>` (desktop table row). Both variants display the same
 * data and wire the same Edit callback. This eliminates the duplication that
 * previously existed between the two views in ProviderDashboard.
 */

import { format, parseISO } from 'date-fns'
import { FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface PatientMember {
  id: string
  token_alias: string
  status: 'active' | 'disabled'
  created_at: string
}

interface PatientRowProps {
  member: PatientMember
  onEdit: (member: PatientMember) => void
  /** `card` = mobile stacked layout; `row` = desktop `<tr>` */
  variant: 'card' | 'row'
}

export function PatientRow({ member, onEdit, variant }: PatientRowProps) {
  const joinedLabel = format(parseISO(member.created_at), 'PPP')
  const statusBadge = (
    <Badge variant={member.status === 'active' ? 'success' : 'secondary'} size="sm">
      {member.status}
    </Badge>
  )

  if (variant === 'card') {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
              {member.token_alias}
            </span>
            {/* Wrap badge in smaller class override for mobile density */}
            <span className="[&>*]:h-5 [&>*]:text-[9px] [&>*]:px-1.5">{statusBadge}</span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">
            Joined: {joinedLabel}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(member)}
          aria-label={`Edit record for ${member.token_alias}`}
        >
          <span className="sr-only">Edit</span>
          <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  // variant === 'row'
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="p-4 text-xs font-bold font-mono text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
        {member.token_alias}
      </td>
      <td className="p-4">{statusBadge}</td>
      <td className="p-4 text-xs text-slate-500 font-bold uppercase">{joinedLabel}</td>
      <td className="p-4 text-right">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(member)}
          className="h-8 text-[10px] font-black uppercase"
          aria-label={`Edit record for ${member.token_alias}`}
        >
          Edit
        </Button>
      </td>
    </tr>
  )
}
