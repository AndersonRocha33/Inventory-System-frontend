import { useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function MobileCountPage() {
  const [position, setPosition] = useState(null)
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [extraItem, setExtraItem] = useState({
    sku: "",
    descricao: "",
    quantidade: ""
  })
  const [message, setMessage] = useState("")

  const params = new URLSearchParams(window.location.search)
  const positionId = params.get("positionId")
  const inventarioId = params.get("inventarioId") || "1"
  const operador = params.get("operador") || ""

  async function loadPositionData() {
    try {
      const positionsResponse = await api.get(`/${inventarioId}/positions`)
      const currentPosition = positionsResponse.data.find(
        (p) => String(p.id) === String(positionId)
      )

      if (!currentPosition) {
        setMessage("Posição não encontrada")
        return
      }

      setPosition(currentPosition)

      if (Number(currentPosition.fase_atual || 1) > 1) {
        const divergentResponse = await api.get(
          `/positions/${positionId}/divergent-items`
        )
        setItems(divergentResponse.data)
      } else {
        const itemsResponse = await api.get(`/positions/${positionId}/items`)
        setItems(itemsResponse.data)
      }
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar dados da posição"
      )
    }
  }

  async function registerCount(itemId) {
    try {
      await api.post(`/items/${itemId}/count`, {
        operador,
        quantidade: Number(counts[itemId] || 0)
      })

      setMessage("Contagem registrada")
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao registrar contagem"
      )
    }
  }

  async function addExtraItem() {
    if (!position) return

    try {
      await api.post(`/positions/${position.id}/extra-item`, {
        sku: extraItem.sku,
        descricao: extraItem.descricao,
        quantidade: Number(extraItem.quantidade),
        operador
      })

      setMessage("Item extra adicionado")
      setExtraItem({
        sku: "",
        descricao: "",
        quantidade: ""
      })

      await loadPositionData()
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao adicionar item extra"
      )
    }
  }

  async function finishPosition() {
    if (!position) return

    try {
      const response = await api.post(`/positions/${position.id}/finish`)

      setMessage(response.data.message || "Posição finalizada")

      setTimeout(() => {
        window.location.href = `/?inventarioId=${inventarioId}&operador=${encodeURIComponent(
          operador
        )}`
      }, 1000)
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao finalizar posição"
      )
    }
  }

  function goBack() {
    window.location.href = `/?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operador
    )}`
  }

  useEffect(() => {
    loadPositionData()
  }, [positionId])

  if (!position) {
    return (
      <div className="container mobile-page">
        <div className="card">
          <h1>Contagem</h1>
          <p>{message || "Carregando..."}</p>
          <button onClick={goBack}>Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mobile-page">
      <div className="card mobile-header-card">
        <div className="mobile-header-top">
          <button onClick={goBack}>Voltar</button>
          <button onClick={finishPosition}>Finalizar</button>
        </div>

        <h1>Contagem da Posição</h1>
        <p>
          <strong>Posição:</strong> {position.codigo}
        </p>
        <p>
          <strong>Operador:</strong> {operador}
        </p>
        <p>
          <strong>Fase:</strong> {position.fase_atual}
        </p>

        {Number(position.fase_atual || 1) > 1 && (
          <p>
            <strong>Modo:</strong> exibindo apenas itens divergentes
          </p>
        )}
      </div>

      {message && <p className="message">{message}</p>}

      <div className="card">
        <h2>Itens</h2>

        {items.length === 0 && <p>Nenhum item para contar.</p>}

        {items.map((item) => (
          <div key={item.id} className="mobile-item-card">
            <div className="mobile-item-info">
              <strong>{item.sku}</strong>
              <p>{item.descricao}</p>
            </div>

            <input
              type="number"
              inputMode="numeric"
              placeholder="Qtd física"
              value={counts[item.id] || ""}
              onChange={(e) =>
                setCounts({
                  ...counts,
                  [item.id]: e.target.value
                })
              }
            />

            <button onClick={() => registerCount(item.id)}>Salvar</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Adicionar item a mais</h2>

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
          inputMode="numeric"
          placeholder="Quantidade"
          value={extraItem.quantidade}
          onChange={(e) =>
            setExtraItem({
              ...extraItem,
              quantidade: e.target.value
            })
          }
        />

        <button onClick={addExtraItem}>Adicionar item extra</button>
      </div>
    </div>
  )
}

export default MobileCountPage