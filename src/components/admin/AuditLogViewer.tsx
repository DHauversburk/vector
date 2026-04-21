import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'

import type { AuditLog } from '../../lib/api/types'
import { logger } from '../../lib/logger'

interface AuditMetadata {
  role?: string
  token_alias?: string
  [key: string]: unknown
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(100)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getAuditLogs({
        type: selectedType || undefined,
        severity: selectedSeverity || undefined,
        limit: pageSize,
      })
      setLogs(data)
    } catch (error) {
      logger.error('AuditLogViewer', 'Failed to load logs', error)
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedSeverity, pageSize])

  const exportCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Action', 'Actor', 'Description', 'Metadata']
    const rows = logs.map((l) => [
      l.created_at,
      l.severity,
      l.action_type,
      (l.metadata as AuditMetadata)?.token_alias ?? l.actor_id ?? 'SYSTEM',
      l.description,
      JSON.stringify(l.metadata ?? {}),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default:
        return <Info className="w-4 h-4 text-slate-400" />
    }
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      case 'ERROR':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'WARN':
        return 'bg-amber-50 border-amber-200 text-amber-700'
      default:
        return 'bg-slate-50 border-slate-200 text-slate-600'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Audit Log
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
            Append-only system event history
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export as CSV"
            aria-label="Export audit log as CSV"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={loadLogs}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Refresh"
            aria-label="Refresh audit log"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex gap-3 text-xs">
        <div className="relative">
          <Filter className="w-3 h-3 absolute left-2 top-2.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setPageSize(100)
            }}
            className="pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Types</option>
            <option value="LOGIN">Auth / Login</option>
            <option value="BOOKING">Booking</option>
            <option value="CANCEL">Cancellation</option>
            <option value="ERROR">System Errors</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value)
              setPageSize(100)
            }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warnings</option>
            <option value="ERROR">Errors Only</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-auto flex flex-col">
        <table className="w-full text-left border-collapse flex-1">
          <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                Timestamp
              </th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                Level
              </th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                Action
              </th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                User
              </th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No records found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${expandedLogId === log.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(log.created_at), 'MM/dd HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${getSeverityStyle(log.severity)}`}
                      >
                        {getSeverityIcon(log.severity)}
                        {log.severity}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                      {log.action_type}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-500 dark:text-slate-400"
                      title={(log.metadata as AuditMetadata)?.role || 'Unknown Role'}
                    >
                      {(log.metadata as AuditMetadata)?.token_alias || log.actor_id || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[300px]">
                      {log.description}
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="bg-slate-900 rounded p-3 text-[10px] font-mono overflow-x-auto">
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest border-b border-slate-700 pb-1 mb-2">
                            Metadata
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <dl className="space-y-1">
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <div key={key} className="flex gap-3">
                                  <dt className="text-slate-500 uppercase text-[9px] font-black tracking-widest shrink-0 w-28">
                                    {key}
                                  </dt>
                                  <dd className="text-slate-300 font-mono text-[10px] break-all">
                                    {typeof value === 'object' && value !== null
                                      ? JSON.stringify(value)
                                      : String(value ?? '')}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="text-slate-600 italic">No metadata.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        {logs.length >= pageSize && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <button
              onClick={() => setPageSize((p) => p + 100)}
              disabled={loading}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading…' : `Load More (showing ${logs.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
