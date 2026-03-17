import { useEffect, useState } from "react"
import api from "./services/api"
import DashboardPage from "./pages/DashboardPage"
import "./index.css"

function InventoryPage() {
  const [inventarioId, setInventarioId] = useState(1)
  const [positions, setPositions] = useState([])
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [items, setItems] = useState([])
  const [operator, setOperator] = useState("")
  const [counts, setCounts] = useState({})
  const [uploadFile, setUploadFile] = useState(null)
  const [extraItem, setExtraItem] = useState({
    sku: "",
    descricao: "",
    quantidade: ""
  })
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

  async function loadItems(positionId) {
    try {
      const response = await api.get(`/positions/${positionId}/items`)
      setItems(response.data)
    } catch (error) {
      console.error("Erro ao carregar itens:", error)
      setMessage(
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao carregar itens"
      )
    }
  }

  async function loadDivergentItems(positionId) {
    try {
      const response = await api.get(`/positions/${positionId}/divergent-items`)
      setItems(response.data)
    } catch (error) {
      console.error("Erro ao carregar itens divergentes:", error)
      setMessage(
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao carregar itens divergentes"
      )
    }
  }

  async function startCounting(position) {
  try {
    const response = await api.post(`/positions/${position.id}/start`, {
      operador: operator
    })

    const posicaoAtual = response.data.position
    setSelectedPosition(posicaoAtual)
    setCounts({})

    if (Number(posicaoAtual.fase_atual || 1) > 1) {
      await loadDivergentItems(position.id)
      setMessage(`Recontagem iniciada - fase ${posicaoAtual.fase_atual}`)
    } else {
      await loadItems(position.id)
      setMessage("Primeira contagem iniciada com sucesso")
    }

    await loadPositions()
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

  async function registerCount(itemId) {
    try {
      await api.post(`/items/${itemId}/count`, {
        operador: operator,
        quantidade: Number(counts[itemId] || 0)
      })

      setMessage("Contagem registrada")
    } catch (error) {
      console.error("Erro ao registrar contagem:", error)
      setMessage(
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao registrar contagem"
      )
    }
  }

  async function addExtraItem() {
    if (!selectedPosition) return

    try {
      await api.post(`/positions/${selectedPosition.id}/extra-item`, {
        sku: extraItem.sku,
        descricao: extraItem.descricao,
        quantidade: Number(extraItem.quantidade),
        operador: operator
      })

      setMessage("Item extra adicionado")
      setExtraItem({
        sku: "",
        descricao: "",
        quantidade: ""
      })

      if (Number(selectedPosition.fase_atual || 1) > 1) {
        await loadDivergentItems(selectedPosition.id)
      } else {
        await loadItems(selectedPosition.id)
      }
    } catch (error) {
      console.error("Erro ao adicionar item extra:", error)
      setMessage(
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao adicionar item extra"
      )
    }
  }

  async function finishPosition() {
    if (!selectedPosition) return

    try {
      const response = await api.post(`/positions/${selectedPosition.id}/finish`)

      const newStatus = response.data.position?.status
      const totalDivergencias = response.data.totalDivergencias || 0

      if (newStatus === "finalizado") {
        setMessage(response.data.message || "Posição finalizada com sucesso")
        setSelectedPosition(null)
        setItems([])
        setCounts({})
      } else if (newStatus === "recontagem") {
        setMessage(response.data.message || `Posição enviada para recontagem. Divergências: ${totalDivergencias}`)
        setSelectedPosition(null)
        setItems([])
        setCounts({})
      } else {
        setMessage(response.data.message || "Posição processada")
      }

      await loadPositions()
    } catch (error) {
      console.error("Erro ao finalizar posição:", error)
      setMessage(
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao finalizar posição"
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
          <button onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="layout">
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
                onClick={() => startCounting(position)}
                disabled={
                  !operator ||
                  position.status === "contando" ||
                  position.status === "finalizado"
                }
              >
                {Number(position.fase_atual || 1) > 1 ? "Iniciar recontagem" : "Iniciar"}
              </button>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Itens da posição</h2>

          {selectedPosition && (
            <>
              <p><strong>Posição:</strong> {selectedPosition.codigo}</p>
              <p><strong>Fase:</strong> {selectedPosition.fase_atual}</p>
              {Number(selectedPosition.fase_atual || 1) > 1 && (
                <p><strong>Modo:</strong> exibindo apenas itens divergentes da fase anterior</p>
              )}
            </>
          )}

          {items.map((item) => (
            <div key={item.id} className="item-row">
              <div>
                <strong>{item.sku}</strong>
                <p>{item.descricao}</p>
              </div>

              <input
                type="number"
                placeholder="Qtd física"
                value={counts[item.id] || ""}
                onChange={(e) =>
                  setCounts({
                    ...counts,
                    [item.id]: e.target.value
                  })
                }
              />

              <button onClick={() => registerCount(item.id)}>
                Salvar
              </button>
            </div>
          ))}

          {selectedPosition && (
            <>
              <h3>Adicionar item encontrado a mais</h3>

              <input
                type="text"
                placeholder="SKU"
                value={extraItem.sku}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    sku: e.target.value
                  })
                }
              />

              <input
                type="text"
                placeholder="Descrição"
                value={extraItem.descricao}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    descricao: e.target.value
                  })
                }
              />

              <input
                type="number"
                placeholder="Quantidade"
                value={extraItem.quantidade}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    quantidade: e.target.value
                  })
                }
              />

              <button onClick={addExtraItem}>
                Adicionar item extra
              </button>

              <button onClick={finishPosition}>
                Finalizar posição
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  if (window.location.pathname === "/dashboard") {
    return <DashboardPage />
  }

  return <InventoryPage />
}

export default App