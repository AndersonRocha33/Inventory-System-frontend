import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR")
}

function HistoryReportPage() {
  const [items, setItems] = useState([])
  const [inventories, setInventories] = useState([])
  const [filter, setFilter] = useState("")
  const [message, setMessage] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  async function loadHistory() {
    try {
      const [historyResponse, inventoriesResponse] = await Promise.all([
        api.get(`/${inventarioId}/history-report`),
        api.get("/")
      ])

      setItems(historyResponse.data)
      setInventories(inventoriesResponse.data)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar histórico"
      )
    }
  }

  const selectedInventory = inventories.find(
    (inventory) => String(inventory.id) === String(inventarioId)
  )

  const filteredItems = useMemo(() => {
    const search = filter.trim().toLowerCase()

    if (!search) return items

    return items.filter((item) => {
      return (
        String(item.posicao || "").toLowerCase().includes(search) ||
        String(item.sku || "").toLowerCase().includes(search) ||
        String(item.descricao || "").toLowerCase().includes(search) ||
        String(item.primeiro_operador || "").toLowerCase().includes(search) ||
        String(item.segundo_operador || "").toLowerCase().includes(search) ||
        String(item.terceiro_operador || "").toLowerCase().includes(search) ||
        String(item.criterio_fechamento || "").toLowerCase().includes(search)
      )
    })
  }, [items, filter])

  const stats = useMemo(() => {
    const total = items.length
    const resolvidos = items.filter((item) => item.resolvido === true).length
    const pendentes = total - resolvidos

    return {
      total,
      resolvidos,
      pendentes
    }
  }, [items])

  useEffect(() => {
    loadHistory()
  }, [inventarioId])

  return (
    <div className="container">
      <h1>Relatório Histórico de Contagens</h1>

      {message && <div className="toast-message">{message}</div>}

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Total de Itens</h3>
          <p className="metric-value">{stats.total}</p>
        </div>

        <div className="card metric-card">
          <h3>Resolvidos</h3>
          <p className="metric-value">{stats.resolvidos}</p>
        </div>

        <div className="card metric-card">
          <h3>Pendentes</h3>
          <p className="metric-value">{stats.pendentes}</p>
        </div>

        <div className="card metric-card">
          <h3>Data do inventário</h3>
          <p className="metric-value">
            {formatDate(selectedInventory?.data_inicio)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Filtro</h2>

        <input
          type="text"
          placeholder="Buscar por posição, SKU, descrição, operador ou critério..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="card">
        <h2>Histórico por Item</h2>

        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>SKU</th>
                <th>Descrição</th>
                <th>Sistema</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Final</th>
                <th>Critério</th>
                <th>Resolvido</th>
                <th>1º Operador</th>
                <th>2º Operador</th>
                <th>3º Operador</th>
                <th>Obs. posição</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={`${item.posicao}-${item.sku}-${index}`}>
                  <td>{item.posicao}</td>
                  <td>{item.sku}</td>
                  <td>{item.descricao}</td>
                  <td>{item.quantidade_sistema}</td>
                  <td>{item.q1 ?? "-"}</td>
                  <td>{item.q2 ?? "-"}</td>
                  <td>{item.q3 ?? "-"}</td>
                  <td>{item.quantidade_final ?? "-"}</td>
                  <td>{item.criterio_fechamento || "-"}</td>
                  <td>{item.resolvido ? "Sim" : "Não"}</td>
                  <td>{item.primeiro_operador || "-"}</td>
                  <td>{item.segundo_operador || "-"}</td>
                  <td>{item.terceiro_operador || "-"}</td>
                  <td>{item.observacao_posicao || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default HistoryReportPage