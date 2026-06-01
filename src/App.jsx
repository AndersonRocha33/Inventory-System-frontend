import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Box,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Flag,
  History,
  Info,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Monitor,
  PackageCheck,
  PackageOpen,
  PlusCircle,
  RotateCcw,
  Trash2,
  Upload,
  UserCircle,
  Warehouse,
  AlertTriangle
} from "lucide-react"

import api from "./services/api"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import HistoryReportPage from "./pages/HistoryReportPage"
import MobileCountPage from "./pages/MobileCountPage"
import PositionsPage from "./pages/PositionsPage"
import FinishedInventoriesPage from "./pages/FinishedInventoriesPage"
import TvDashboardPage from "./pages/TvDashboardPage"
import SelectPositionsPage from "./pages/SelectPositionsPage"
import "./index.css"

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR")
}

function InventoryPage() {
  const params = new URLSearchParams(window.location.search)
  const loggedUser = JSON.parse(localStorage.getItem("inventory_user") || "null")

  const [inventarioId, setInventarioId] = useState(params.get("inventarioId") || "")
  const [inventories, setInventories] = useState([])
  const [positions, setPositions] = useState([])
  const [operator, setOperator] = useState(params.get("operador") || loggedUser?.nome || "")
  const [uploadFile, setUploadFile] = useState(null)
  const [dataInventario, setDataInventario] = useState("")
  const [message, setMessage] = useState("")
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [inventoryMode, setInventoryMode] = useState("geral")

  const apiBaseUrl = import.meta.env.VITE_API_URL
  const backendBaseUrl = apiBaseUrl.replace(/\/inventory$/, "")

  async function loadInventories() {
    try {
      const response = await api.get("/")
      setInventories(response.data)

      if (!inventarioId && response.data.length > 0) {
        const openInventory = response.data.find(
          (inventory) => inventory.status !== "finalizado" && inventory.arquivado !== true
        )

        setInventarioId(openInventory?.id || response.data[0].id)
      }
    } catch {
      setMessage("Erro ao carregar inventários")
    }
  }

  async function loadPositions(id = inventarioId) {
    if (!id) return

    try {
      const response = await api.get(`/${id}/positions`)
      setPositions(response.data)
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        return
      }

      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar posições"
      )
    }
  }

  async function uploadInventoryFile() {
    if (!uploadFile) {
      setMessage("Selecione um arquivo CSV")
      return
    }

    if (!dataInventario) {
      setMessage("Informe a data do inventário")
      return
    }

    try {
      setLoadingUpload(true)
      setMessage("Enviando arquivo... aguarde")

      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("dataInventario", dataInventario)

      const response = await api.post("/upload", formData)
      const novoInventarioId = response.data.inventarioId

      setInventarioId(novoInventarioId)
      setMessage(
        `Inventário de ${formatDate(dataInventario)} criado com ${response.data.totalPosicoes} posições.`
      )

      await loadInventories()
      await loadPositions(novoInventarioId)

      if (inventoryMode === "ciclico") {
        window.location.href = `/select-positions?inventarioId=${novoInventarioId}&operador=${encodeURIComponent(
          operator
        )}`
      }
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        return
      }

      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao enviar CSV"
      )
    } finally {
      setLoadingUpload(false)
    }
  }

  function copyShareLink() {
    if (!inventarioId) {
      setMessage("Selecione um inventário primeiro")
      return
    }

    const url = `${window.location.origin}/?inventarioId=${inventarioId}`
    navigator.clipboard.writeText(url)
    setMessage("Link do inventário copiado.")
  }

  function openDashboard() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    window.open(`${window.location.origin}/dashboard?inventarioId=${inventarioId}`, "_blank")
  }

  function openTvDashboard() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    window.open(`${window.location.origin}/tv-dashboard?inventarioId=${inventarioId}`, "_blank")
  }

  function openHistoryReport() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    window.open(`${window.location.origin}/history-report?inventarioId=${inventarioId}`, "_blank")
  }

  function openFinishedInventories() {
    window.location.href = "/finished-inventories"
  }

  function openPositionsPage() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    if (!operator) {
      setMessage("Informe o operador")
      return
    }

    window.location.href = `/positions?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operator
    )}`
  }

  function openSelectPositionsPage() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    window.location.href = `/select-positions?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operator
    )}`
  }

  function exportCsv() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    const token = localStorage.getItem("inventory_token")
    const url = `${backendBaseUrl}/inventory/${inventarioId}/export`

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = "inventario.csv"
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
      .catch(() => setMessage("Erro ao exportar CSV"))
  }

  function exportExcel() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    const token = localStorage.getItem("inventory_token")
    const url = `${backendBaseUrl}/inventory/${inventarioId}/export-excel`

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = "inventario.xlsx"
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
      .catch(() => setMessage("Erro ao exportar Excel"))
  }

  async function finishSelectedInventory() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    const pendencias = stats.pendentes + stats.andamento + stats.recontagem

    const confirmed = window.confirm(
      pendencias > 0
        ? `Este inventário ainda possui pendências:\n\nPendentes: ${stats.pendentes}\nEm andamento: ${stats.andamento}\nRecontagem: ${stats.recontagem}\n\nDeseja finalizar mesmo assim?`
        : "Deseja finalizar este inventário?"
    )

    if (!confirmed) return

    try {
      const response = await api.post(`/${inventarioId}/finish`)
      setMessage(response.data.message || "Inventário finalizado")

      await loadInventories()
      await loadPositions()
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao finalizar inventário"
      )
    }
  }

  async function deleteSelectedInventory() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    const confirmed = window.confirm("Deseja realmente excluir este inventário?")
    if (!confirmed) return

    try {
      await api.delete(`/${inventarioId}`)
      setMessage("Inventário excluído")
      setInventarioId("")
      setPositions([])
      await loadInventories()
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao excluir inventário"
      )
    }
  }

  function logout() {
    localStorage.removeItem("inventory_user")
    localStorage.removeItem("inventory_token")
    window.location.href = "/login"
  }

  const activeInventories = inventories.filter(
    (inventory) => inventory.status !== "finalizado" && inventory.arquivado !== true
  )

  const selectedInventory = inventories.find(
    (inventory) => String(inventory.id) === String(inventarioId)
  )

  const stats = useMemo(() => {
    const total = positions.length
    const pendentes = positions.filter((p) => p.status === "pendente").length
    const andamento = positions.filter((p) => p.status === "contando").length
    const recontagem = positions.filter((p) => p.status === "recontagem").length
    const finalizadas = positions.filter((p) => p.status === "finalizado").length
    const percentual = total > 0 ? Math.round((finalizadas / total) * 100) : 0

    return {
      total,
      pendentes,
      andamento,
      recontagem,
      finalizadas,
      percentual
    }
  }, [positions])

  useEffect(() => {
    loadInventories()
  }, [])

  useEffect(() => {
    loadPositions()
  }, [inventarioId])

  useEffect(() => {
    if (!inventarioId) return

    const interval = setInterval(() => {
      loadPositions()
    }, 30000)

    return () => clearInterval(interval)
  }, [inventarioId])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <div>
            <h1>
              Spot<span>Inventory</span>
            </h1>
            <p>Inventário operacional</p>
          </div>
        </div>

        <div className="sidebar-user">
          <div>
            <span>Usuário logado</span>
            <strong>{loggedUser?.nome || "-"}</strong>
          </div>

          <UserCircle size={30} />
        </div>

        <nav className="sidebar-actions">
          <button onClick={openDashboard}>
            <BarChart3 size={24} />
            Dashboard
          </button>

          <button onClick={openTvDashboard}>
            <Monitor size={24} />
            TV/CD
          </button>

          <button onClick={openHistoryReport}>
            <History size={24} />
            Histórico
          </button>

          <button onClick={openFinishedInventories}>
            <PackageCheck size={24} />
            Inventários finalizados
          </button>

          <button onClick={exportCsv}>
            <FileText size={24} />
            Exportar CSV
          </button>

          <button onClick={exportExcel}>
            <FileSpreadsheet size={24} />
            Exportar Excel
          </button>

          <button onClick={logout} className="secondary-button logout-button">
            <LogOut size={24} />
            Sair
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <section className="inventory-topbar">
          <div>
            <span>Inventário ativo:</span>
            <strong>
              {selectedInventory
                ? `${formatDate(selectedInventory.data_inicio)} - ${selectedInventory.deposito || "-"} - ID ${selectedInventory.id}`
                : "Nenhum inventário selecionado"}
            </strong>
          </div>

          <button onClick={copyShareLink} className="topbar-link-button">
            Compartilhar inventário
          </button>
        </section>

        <section className="live-panel">
          <div className="live-progress">
            <div>
              <span>Progresso geral {stats.percentual}%</span>
              <strong>{stats.percentual}%</strong>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.percentual}%` }} />
            </div>
          </div>
        </section>

        {message && <div className="toast-message">{message}</div>}

        <section className="summary-grid">
          <MetricCard
            icon={<Box size={40} />}
            title="Total posições"
            value={stats.total}
            subtitle="posições"
          />

          <MetricCard
            icon={<Clock3 size={40} />}
            title="Pendentes"
            value={stats.pendentes}
            subtitle="aguardando"
          />

          <MetricCard
            icon={<RotateCcw size={40} />}
            title="Em contagem"
            value={stats.andamento}
            subtitle="em andamento"
          />

          <MetricCard
            icon={<AlertTriangle size={40} />}
            title="Recontagem"
            value={stats.recontagem}
            subtitle="com divergência"
          />

          <MetricCard
            icon={<CheckCircle size={40} />}
            title="Finalizadas"
            value={stats.finalizadas}
            subtitle="concluídas"
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="section-title-row">
              <div className="section-icon">
                <FilePlus2 size={32} />
              </div>

              <div>
                <h3>Novo inventário</h3>
                <p>Carregue o CSV e informe a data de realização.</p>
              </div>
            </div>

            <label>Data do inventário</label>
            <div className="input-with-icon">
              <input
                type="date"
                value={dataInventario}
                onChange={(e) => setDataInventario(e.target.value)}
              />
              <CalendarDays size={22} />
            </div>

            <label>Arquivo CSV</label>
            <div className="file-row">
              <div className="file-icon">
                <Upload size={22} />
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
            </div>

            <button className="button-with-icon create-button" onClick={uploadInventoryFile} disabled={loadingUpload}>
              <PlusCircle size={22} />
              {loadingUpload ? "Enviando..." : "Criar inventário"}
            </button>

            <div className="inventory-mode-grid">
              <button
                type="button"
                className={`mode-card mode-general ${
                  inventoryMode === "geral" ? "mode-card-active" : ""
                }`}
                onClick={() => setInventoryMode("geral")}
              >
                <div className="mode-icon">
                  <PackageOpen size={34} />
                </div>

                <div>
                  <strong>Inventário Geral</strong>
                  <span>Todas as posições do CSV</span>
                </div>
              </button>

              <button
                type="button"
                className={`mode-card mode-cycle ${
                  inventoryMode === "ciclico" ? "mode-card-active" : ""
                }`}
                onClick={() => setInventoryMode("ciclico")}
              >
                <div className="mode-icon">
                  <ListChecks size={34} />
                </div>

                <div>
                  <strong>Inventário Cíclico</strong>
                  <span>Selecionar posições depois</span>
                </div>
              </button>
            </div>

            <p className="mode-helper">
              <Info size={16} />
              No inventário cíclico você poderá selecionar apenas as posições desejadas.
            </p>
          </div>

          <div className="panel">
            <div className="section-title-row">
              <div className="section-icon">
                <ClipboardList size={32} />
              </div>

              <div>
                <h3>Inventário ativo</h3>
                <p>Escolha o inventário e abra a tela de posições.</p>
              </div>
            </div>

            <label>Inventário</label>
            <select
              value={inventarioId}
              onChange={(e) => setInventarioId(e.target.value)}
              className="filter-select"
            >
              <option value="">Selecione um inventário</option>

              {activeInventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {formatDate(inventory.data_inicio)} - {inventory.deposito || "-"} - ID {inventory.id}
                </option>
              ))}
            </select>

            <label>Operador</label>
            <input
              type="text"
              placeholder="Digite o operador"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />

            <div className="action-grid">
              <button onClick={openPositionsPage} className="button-with-icon">
                <Warehouse size={24} />
                Abrir posições
              </button>

              <button onClick={openSelectPositionsPage} className="button-with-icon outline-action-button">
                <ListChecks size={24} />
                Selecionar posições
              </button>

              <button onClick={finishSelectedInventory} className="button-with-icon">
                <Flag size={24} />
                Finalizar inventário
              </button>

              <button onClick={deleteSelectedInventory} className="button-with-icon danger-button">
                <Trash2 size={24} />
                Excluir inventário
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({ icon, title, value, subtitle }) {
  return (
    <div className="summary-card metric-with-icon">
      <div className="metric-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function App() {
  const loggedUser = JSON.parse(localStorage.getItem("inventory_user") || "null")

  if (!loggedUser && window.location.pathname !== "/login") return <AuthPage />
  if (window.location.pathname === "/login") return <AuthPage />
  if (window.location.pathname === "/dashboard") return <DashboardPage />
  if (window.location.pathname === "/history-report") return <HistoryReportPage />
  if (window.location.pathname === "/count") return <MobileCountPage />
  if (window.location.pathname === "/positions") return <PositionsPage />
  if (window.location.pathname === "/finished-inventories") return <FinishedInventoriesPage />
  if (window.location.pathname === "/tv-dashboard") return <TvDashboardPage />
  if (window.location.pathname === "/select-positions") return <SelectPositionsPage />

  return <InventoryPage />
}

export default App