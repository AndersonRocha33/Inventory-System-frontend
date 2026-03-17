import { useEffect, useState } from "react"
import api from "./services/api"
import DashboardPage from "./pages/DashboardPage"
import HistoryReportPage from "./pages/HistoryReportPage"
import MobileCountPage from "./pages/MobileCountPage"
import "./index.css"

function InventoryPage() {
  const params = new URLSearchParams(window.location.search)

  const [inventarioId, setInventarioId] = useState(
    params.get("inventarioId") || 1
  )
  const [positions, setPositions] = useState([])
  const [operator, setOperator] = useState(params.get("operador") || "")
  const [uploadFile, setUploadFile] = useState(null)
  const [message, setMessage] = useState("")
  const [loadingUpload, setLoadingUpload] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_URL
  const backendBaseUrl = apiBaseUrl.replace(/\/inventory$/, "")

  async function loadPositions() {
    try {
      const response = await api.get(`/${inventarioId}/positions`)
      setPositions(response.data)
    } catch (error) {
      console.error("Erro ao carregar posições:", error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar posições"
      )
    }
  }

  async function loadPositionsById(id) {
    try {
      const response = await api.get(`/${id}/positions`)
      setPositions(response.data)
    } catch (error) {
      console.error("Erro ao carregar posições por id:", error)
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

    try {
      setLoadingUpload(true)
      setMessage("Enviando arquivo... aguarde")

      const formData = new FormData()
      formData.append("file", uploadFile)

      const response = await api.post("/upload", formData)

      const novoInventarioId = response.data.inventarioId

      setInventarioId(novoInventarioId)
      setMessage(
        `Upload concluído. Inventário ${novoInventarioId} criado com ${response.data.totalPosicoes} posições.`
      )

      await loadPositionsById(novoInventarioId)
    } catch (error) {
      console.error("Erro completo no upload:", error)

      if (!error.response) {
        setMessage("Erro de rede. Verifique se o backend publicado está online.")
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

  async function openCountPage(position) {
    try {
      if (!operator || !operator.trim()) {
        setMessage("Informe o operador antes de iniciar")
        return
      }

      await api.post(`/positions/${position.id}/start`, {
        operador: operator
      })

      window.location.href = `/count?positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
        operator
      )}`
    } catch (error) {
      console.error("Erro ao iniciar contagem:", error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao iniciar contagem"
      )
    }
  }

  function exportCsv() {
    const url = `${backendBaseUrl}/inventory/${inventarioId}/export`
    window.open(url, "_blank")
  }

  function openDashboard() {
    const url = `${window.location.origin}/dashboard?inventarioId=${inventarioId}`
    window.open(url, "_blank")
  }

  function openHistoryReport() {
    const url = `${window.location.origin}/history-report?inventarioId=${inventarioId}`
    window.open(url, "_blank")
  }

  useEffect(() => {
    loadPositions()
  }, [inventarioId])

  return (
    <div className="container">
      <h1>Sistema de Inventário</h1>

      <div className="card">
        <h2>Upload do CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setUploadFile(e.target.files[0])}
        />

        <button onClick={uploadInventoryFile} disabled={loadingUpload}>
          {loadingUpload ? "Enviando..." : "Enviar CSV"}
        </button>
      </div>

      <div className="card">
        <label>Inventário ID</label>
        <input
          type="number"
          value={inventarioId}
          onChange={(e) => setInventarioId(e.target.value)}
        />

        <label>Operador</label>
        <input
          type="text"
          placeholder="Digite seu nome"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
        />

        <div className="actions">
          <button onClick={loadPositions}>Carregar posições</button>
          <button onClick={openDashboard}>Dashboard de acuracidade</button>
          <button onClick={openHistoryReport}>Relatório histórico</button>
          <button onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="card">
        <h2>Posições</h2>

        {positions.map((position) => (
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
              disabled={
                !operator ||
                position.status === "contando" ||
                position.status === "finalizado"
              }
            >
              {Number(position.fase_atual || 1) > 1
                ? "Abrir recontagem"
                : "Abrir contagem"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  if (window.location.pathname === "/dashboard") {
    return <DashboardPage />
  }

  if (window.location.pathname === "/history-report") {
    return <HistoryReportPage />
  }

  if (window.location.pathname === "/count") {
    return <MobileCountPage />
  }

  return <InventoryPage />
}

export default App