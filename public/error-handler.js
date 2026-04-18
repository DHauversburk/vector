/**
 * VECTOR — Critical runtime error handler
 *
 * Loaded before main.tsx so fatal JS errors (e.g. chunk load failure)
 * show a meaningful fallback instead of a blank screen.
 * Kept as a standalone file so CSP can serve it under 'self' without
 * requiring 'unsafe-inline'.
 */
window.onerror = function (message, _source, _lineno, _colno, _error) {
  var existing = document.getElementById('runtime-error-banner')
  if (existing) return
  var banner = document.createElement('div')
  banner.id = 'runtime-error-banner'
  banner.setAttribute(
    'style',
    'color:#fff;background:#7f1d1d;padding:16px 24px;position:fixed;top:0;left:0;width:100%;z-index:9999;font-family:system-ui,sans-serif;font-size:13px;',
  )
  banner.textContent = 'Application error: ' + message + ' — please reload the page.'
  document.body.prepend(banner)
}
