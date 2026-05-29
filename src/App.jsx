import { useEffect, useMemo, useState } from "react"
import api from "./services/api"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import HistoryReportPage from "./pages/HistoryReportPage"
import MobileCountPage from "./pages/MobileCountPage"
import PositionsPage from "./pages/PositionsPage"
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

  const apiBaseUrl = import.meta.env.VITE_API_URL
  const backendBaseUrl = apiBaseUrl.replace(/\/inventory$/, "")

  async function loadInventories() {
    try {
      const response = await api.get("/")
      setInventories(response.data)

      if (!inventarioId && response.data.length > 0) {
        setInventarioId(response.data[0].id)
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
    window.open(`${window.location.origin}/dashboard?inventarioId=${inventarioId}`, "_blank")
  }

  function openHistoryReport() {
    window.open(`${window.location.origin}/history-report?inventarioId=${inventarioId}`, "_blank")
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

  function exportCsv() {
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

  async function finishSelectedInventory() {
    if (!inventarioId) {
      setMessage("Selecione um inventário")
      return
    }

    const confirmed = window.confirm("Deseja finalizar este inventário?")
    if (!confirmed) return

    try {
      await api.post(`/${inventarioId}/finish`)
      setMessage("Inventário finalizado e arquivado")
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
            <h1>SpotInventory</h1>
            <p>Inventário operacional</p>
          </div>
        </div>

        <div className="sidebar-user">
          <span>Usuário logado</span>
          <strong>{loggedUser?.nome || "-"}</strong>
        </div>

        <nav className="sidebar-actions">
          <button onClick={openDashboard}>Dashboard</button>
          <button onClick={openHistoryReport}>Histórico</button>
          <button onClick={exportCsv}>Exportar CSV</button>
          <button onClick={logout} className="secondary-button">
            Sair
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div>
            <p className="eyebrow">Sistema de inventário</p>
            <h2>Controle de posições</h2>
            <span>
              Selecione o inventário, compartilhe com os operadores e acompanhe o andamento.
            </span>
          </div>

          <button onClick={copyShareLink}>Compartilhar inventário</button>
        </header>

        {message && <div className="toast-message">{message}</div>}

        <section className="live-panel">
          <div>
            <span>Inventário ativo</span>
            <strong>
              {selectedInventory
                ? `${formatDate(selectedInventory.data_inicio)} - ${selectedInventory.deposito || "-"}`
                : "Nenhum inventário selecionado"}
            </strong>
          </div>

          <div className="live-progress">
            <div>
              <span>Progresso</span>
              <strong>{stats.percentual}%</strong>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${stats.percentual}%` }} />
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Total</span>
            <strong>{stats.total}</strong>
            <p>posições</p>
          </div>

          <div className="summary-card">
            <span>Pendentes</span>
            <strong>{stats.pendentes}</strong>
            <p>aguardando</p>
          </div>

          <div className="summary-card">
            <span>Em contagem</span>
            <strong>{stats.andamento}</strong>
            <p>em andamento</p>
          </div>

          <div className="summary-card">
            <span>Recontagem</span>
            <strong>{stats.recontagem}</strong>
            <p>com divergência</p>
          </div>

          <div className="summary-card">
            <span>Finalizadas</span>
            <strong>{stats.finalizadas}</strong>
            <p>concluídas</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Novo inventário</h3>
                <p>Carregue o CSV e informe a data de realização.</p>
              </div>
            </div>

            <label>Data do inventário</label>
            <input
              type="date"
              value={dataInventario}
              onChange={(e) => setDataInventario(e.target.value)}
            />

            <label>Arquivo CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />

            <button onClick={uploadInventoryFile} disabled={loadingUpload}>
              {loadingUpload ? "Enviando..." : "Criar inventário"}
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
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
              <option value="">Selecione</option>

              {inventories.map((inventory) => (
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
              <button onClick={openPositionsPage}>
                Abrir posições
              </button>

              <button onClick={finishSelectedInventory}>
                Finalizar
              </button>

              <button onClick={deleteSelectedInventory} className="danger-button action-grid-full">
                Excluir inventário
              </button>
            </div>
          </div>
        </section>
      </main>
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

  return <InventoryPage />
}

export default App