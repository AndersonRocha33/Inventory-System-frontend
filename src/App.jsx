import { useEffect, useMemo, useState } from "react"
import api from "./services/api"
import AuthPage from "./pages/AuthPage"
import DashboardPage from "./pages/DashboardPage"
import HistoryReportPage from "./pages/HistoryReportPage"
import MobileCountPage from "./pages/MobileCountPage"
import "./index.css"

function formatDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  return date.toLocaleDateString("pt-BR")
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

  const [statusFilter, setStatusFilter] = useState("todos")
  const [positionFilter, setPositionFilter] = useState("")

  const apiBaseUrl = import.meta.env.VITE_API_URL
  const backendBaseUrl = apiBaseUrl.replace(/\/inventory$/, "")

  async function loadInventories() {
    try {
      const response = await api.get("/")
      setInventories(response.data)

      if (!inventarioId && response.data.length > 0) {
        setInventarioId(response.data[0].id)
      }
    } catch (error) {
      console.error(error)
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
        `Upload concluído. Inventário de ${formatDate(dataInventario)} criado com ${response.data.totalPosicoes} posições.`
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

  function getReviewPhase(position) {
    if (position.primeiro_operador === operator) return 1
    if (position.segundo_operador === operator) return 2
    if (position.terceiro_operador === operator) return 3
    return position.fase_atual || 1
  }

  function operatorAlreadyCounted(position) {
    return (
      position.primeiro_operador === operator ||
      position.segundo_operador === operator ||
      position.terceiro_operador === operator
    )
  }

  async function openCountPage(position) {
    try {
      if (!operator || !operator.trim()) {
        setMessage("Informe o operador antes de iniciar")
        return
      }

      const alreadyCounted = operatorAlreadyCounted(position)
      const isRecount = position.status === "recontagem"

      if (alreadyCounted && isRecount) {
        const reviewPhase = getReviewPhase(position)

        window.location.href = `/count?mode=review&positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
          operator
        )}&reviewPhase=${reviewPhase}`

        return
      }

      await api.post(`/positions/${position.id}/start`, {
        operador: operator
      })

      window.location.href = `/count?mode=count&positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
        operator
      )}`
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
        return
      }

      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao iniciar contagem"
      )
    }
  }

  function copyShareLink() {
    if (!inventarioId) {
      setMessage("Selecione um inventário primeiro")
      return
    }

    const url = `${window.location.origin}/?inventarioId=${inventarioId}`

    navigator.clipboard.writeText(url)
    setMessage("Link do inventário copiado. Envie para os operadores.")
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

  function openDashboard() {
    window.open(`${window.location.origin}/dashboard?inventarioId=${inventarioId}`, "_blank")
  }

  function openHistoryReport() {
    window.open(`${window.location.origin}/history-report?inventarioId=${inventarioId}`, "_blank")
  }

  function clearFilters() {
    setStatusFilter("todos")
    setPositionFilter("")
  }

  function logout() {
    localStorage.removeItem("inventory_user")
    localStorage.removeItem("inventory_token")
    window.location.href = "/login"
  }

  const selectedInventory = inventories.find(
    (inventory) => String(inventory.id) === String(inventarioId)
  )

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesStatus =
        statusFilter === "todos" ? true : position.status === statusFilter

      const matchesPosition = String(position.codigo || "")
        .toLowerCase()
        .includes(positionFilter.trim().toLowerCase())

      return matchesStatus && matchesPosition
    })
  }, [positions, statusFilter, positionFilter])

  useEffect(() => {
    loadInventories()
  }, [])

  useEffect(() => {
    loadPositions()
  }, [inventarioId])

  return (
    <div className="container">
      <h1>Sistema de Inventário</h1>

      <div className="card">
        <div className="top-bar">
          <div>
            <strong>Usuário:</strong> {loggedUser?.nome || "-"}
          </div>
          <button onClick={logout}>Sair</button>
        </div>
      </div>

      <div className="card">
        <h2>Novo inventário</h2>

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
          {loadingUpload ? "Enviando..." : "Criar inventário com CSV"}
        </button>
      </div>

      <div className="card">
        <h2>Selecionar inventário</h2>

        <label>Inventário por data</label>
        <select
          value={inventarioId}
          onChange={(e) => setInventarioId(e.target.value)}
          className="filter-select"
        >
          <option value="">Selecione um inventário</option>
          {inventories.map((inventory) => (
            <option key={inventory.id} value={inventory.id}>
              {formatDate(inventory.data_inicio)} - {inventory.deposito || "Sem depósito"} - ID {inventory.id}
            </option>
          ))}
        </select>

        {selectedInventory && (
          <p>
            <strong>Inventário selecionado:</strong>{" "}
            {formatDate(selectedInventory.data_inicio)} - {selectedInventory.deposito || "-"}
          </p>
        )}

        <label>Operador</label>
        <input
          type="text"
          placeholder="Digite seu nome"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
        />

        <div className="actions">
          <button onClick={() => loadPositions()}>Carregar posições</button>
          <button onClick={copyShareLink}>Copiar link para operadores</button>
          <button onClick={openDashboard}>Dashboard</button>
          <button onClick={openHistoryReport}>Relatório histórico</button>
          <button onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>

      <div className="card">
        <h2>Filtros</h2>

        <label>Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="contando">Contando</option>
          <option value="recontagem">Recontagem</option>
          <option value="finalizado">Finalizado</option>
        </select>

        <label>Posição</label>
        <input
          type="text"
          placeholder="Ex.: K.01.4"
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        />

        <button onClick={clearFilters}>Limpar filtros</button>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="card">
        <div className="top-bar">
          <h2>Posições</h2>
          <span>
            <strong>{filteredPositions.length}</strong> resultado(s)
          </span>
        </div>

        {filteredPositions.map((position) => {
          const alreadyCounted = operatorAlreadyCounted(position)
          const isRecount = position.status === "recontagem"

          return (
            <div key={position.id} className="position-row">
              <div>
                <strong>{position.codigo}</strong>
                <p>Status: {position.status}</p>
                <p>Fase atual: {position.fase_atual}</p>
                <p>1º contador: {position.primeiro_operador || "-"}</p>
                <p>2º contador: {position.segundo_operador || "-"}</p>
                <p>3º contador: {position.terceiro_operador || "-"}</p>
              </div>

              <button
                onClick={() => openCountPage(position)}
                disabled={!operator || position.status === "contando"}
              >
                {alreadyCounted && isRecount
                  ? "Revisar posição"
                  : Number(position.fase_atual || 1) > 1
                  ? "Abrir recontagem"
                  : position.status === "finalizado"
                  ? "Revisar posição"
                  : "Abrir contagem"}
              </button>
            </div>
          )
        })}
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

  return <InventoryPage />
}

export default App