import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function HistoryReportPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  useEffect(() => {
    async function loadHistoryReport() {
      try {
        setLoading(true)
        const response = await api.get(`/${inventarioId}/history-report`)
        setRows(response.data)
      } catch (err) {
        console.error(err)
        setError("Erro ao carregar relatório histórico")
      } finally {
        setLoading(false)
      }
    }

    loadHistoryReport()
  }, [inventarioId])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return rows

    return rows.filter((row) => {
      return (
        String(row.posicao || "").toLowerCase().includes(term) ||
        String(row.sku || "").toLowerCase().includes(term) ||
        String(row.descricao || "").toLowerCase().includes(term) ||
        String(row.primeiro_operador || "").toLowerCase().includes(term) ||
        String(row.segundo_operador || "").toLowerCase().includes(term) ||
        String(row.terceiro_operador || "").toLowerCase().includes(term) ||
        String(row.criterio_fechamento || "").toLowerCase().includes(term)
      )
    })
  }, [rows, search])

  const resumo = useMemo(() => {
    const total = filteredRows.length
    const resolvidos = filteredRows.filter((row) => row.resolvido).length
    const pendentes = total - resolvidos

    return {
      total,
      resolvidos,
      pendentes
    }
  }, [filteredRows])

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h1>Relatório Histórico</h1>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h1>Relatório Histórico</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Relatório Histórico de Contagens</h1>

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Total de Itens</h3>
          <p className="metric-value">{resumo.total}</p>
        </div>

        <div className="card metric-card">
          <h3>Resolvidos</h3>
          <p className="metric-value">{resumo.resolvidos}</p>
        </div>

        <div className="card metric-card">
          <h3>Pendentes</h3>
          <p className="metric-value">{resumo.pendentes}</p>
        </div>

        <div className="card metric-card">
          <h3>Inventário ID</h3>
          <p className="metric-value">{inventarioId}</p>
        </div>
      </div>

      <div className="card">
        <h2>Filtro</h2>
        <input
          type="text"
          placeholder="Buscar por posição, SKU, descrição, operador ou critério..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <h2>Histórico por Item</h2>

        {filteredRows.length === 0 ? (
          <p>Nenhum registro encontrado.</p>
        ) : (
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
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={`${row.posicao}-${row.sku}-${index}`}>
                    <td>{row.posicao || "-"}</td>
                    <td>{row.sku || "-"}</td>
                    <td>{row.descricao || "-"}</td>
                    <td>{row.quantidade_sistema ?? "-"}</td>
                    <td>{row.q1 ?? "-"}</td>
                    <td>{row.q2 ?? "-"}</td>
                    <td>{row.q3 ?? "-"}</td>
                    <td>{row.quantidade_final ?? "-"}</td>
                    <td>{row.criterio_fechamento || "-"}</td>
                    <td>{row.resolvido ? "Sim" : "Não"}</td>
                    <td>{row.primeiro_operador || "-"}</td>
                    <td>{row.segundo_operador || "-"}</td>
                    <td>{row.terceiro_operador || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryReportPage