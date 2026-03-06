const core = window[Symbol.for("typora-plugin-core@v2")]
const Plugin = core.Plugin

const STYLE_ID = "typora-plugin-updated-footer-style"
const FOOTER_ID = "typora-plugin-updated-footer"

function getReqNode() {
  if (typeof window.reqnode === "function") return window.reqnode
  if (typeof reqnode === "function") return reqnode
  return null
}

function getCurrentFilePath() {
  const filePath =
    (window.File && typeof window.File.filePath === "string" && window.File.filePath) ||
    (window.File && window.File.bundle && typeof window.File.bundle.filePath === "string" && window.File.bundle.filePath) ||
    ""

  if (!filePath) return ""
  if (filePath.startsWith("file://")) {
    return decodeURIComponent(filePath.replace(/^file:\/\//, ""))
  }
  return filePath
}

function getFileMtime(filePath) {
  const req = getReqNode()
  if (!filePath || !window.File || !window.File.isNode || !req) return null

  try {
    const fs = req("fs")
    const stat = fs.statSync(filePath)
    if (!stat || !stat.mtime) return null
    return new Date(stat.mtime)
  } catch (_) {
    return null
  }
}

function formatUpdatedTime(date) {
  const yyyy = date.getFullYear()
  const MM = date.getMonth() + 1
  const dd = date.getDate()
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  const ss = String(date.getSeconds()).padStart(2, "0")
  return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`
}

function getWriteRoot() {
  const area = window.editor && window.editor.writingArea
  if (area instanceof HTMLElement) {
    return area.querySelector("#write") || area
  }
  if (area && typeof area.get === "function") {
    const root = area.get(0)
    if (root) return root.querySelector("#write") || root
  }
  return document.querySelector("#write") || document.body
}

class UpdatedFooterPlugin extends Plugin {
  onload() {
    this.lastByPath = Object.create(null)
    this.currentPath = ""
    this.timer = 0

    this.injectStyle()
    this.ensureFooter()
    this.refreshFromFile(false)

    this.register(this.app.workspace.on("file:open", () => {
      this.refreshFromFile(false)
      window.setTimeout(() => this.refreshFromFile(false), 120)
    }))

    this.register(this.app.workspace.on("file:will-save", () => {
      const now = new Date()
      const path = getCurrentFilePath() || this.currentPath || "__unknown__"
      this.lastByPath[path] = now.getTime()
      this.setFooterTime(now)
      window.setTimeout(() => this.refreshFromFile(true), 500)
      window.setTimeout(() => this.refreshFromFile(true), 1200)
    }))

    this.timer = window.setInterval(() => this.refreshFromFile(false), 1500)
  }

  onunload() {
    if (this.timer) {
      window.clearInterval(this.timer)
      this.timer = 0
    }

    const footer = document.getElementById(FOOTER_ID)
    if (footer && footer.parentElement) footer.parentElement.removeChild(footer)

    const style = document.getElementById(STYLE_ID)
    if (style && style.parentElement) style.parentElement.removeChild(style)
  }

  injectStyle() {
    if (document.getElementById(STYLE_ID)) return

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
#${FOOTER_ID} {
  margin-top: 2.2em;
  padding-top: 1.2em;
  border-top: 1px solid rgba(127, 127, 127, 0.22);
  color: rgba(127, 132, 144, 0.95);
  font-size: 0.78em;
  line-height: 1.3;
  letter-spacing: 0.01em;
}

#${FOOTER_ID} .updated-footer-label {
  margin-right: 0.25em;
  opacity: 0.95;
  font-weight: 600;
}
`
    document.head.appendChild(style)
  }

  ensureFooter() {
    const root = getWriteRoot()
    if (!root) return null

    let footer = document.getElementById(FOOTER_ID)
    if (!footer) {
      footer = document.createElement("div")
      footer.id = FOOTER_ID
      footer.innerHTML = '<span class="updated-footer-label">最后更新于:</span><span class="updated-footer-time">-</span>'
    }

    root.appendChild(footer)
    return footer
  }

  setFooterText(text) {
    const footer = this.ensureFooter()
    if (!footer) return
    const timeEl = footer.querySelector(".updated-footer-time")
    if (timeEl) timeEl.textContent = text
  }

  setFooterTime(date) {
    this.setFooterText(formatUpdatedTime(date))
  }

  refreshFromFile(fallbackToNow) {
    const filePath = getCurrentFilePath()
    if (filePath) this.currentPath = filePath

    const key = filePath || this.currentPath || "__unknown__"
    const mtime = getFileMtime(filePath || this.currentPath)

    if (mtime) {
      this.lastByPath[key] = mtime.getTime()
      this.setFooterTime(mtime)
      return
    }

    if (this.lastByPath[key]) {
      this.setFooterTime(new Date(this.lastByPath[key]))
      return
    }

    if (fallbackToNow) {
      const now = new Date()
      this.lastByPath[key] = now.getTime()
      this.setFooterTime(now)
      return
    }

    this.setFooterText("-")
  }
}

export default UpdatedFooterPlugin
