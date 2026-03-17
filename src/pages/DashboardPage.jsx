import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function DashboardPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get(`/${inventarioId}/report`)
        setReport(response.data)
      } catch (err) {
        console.error(err)
        setError("Erro ao carregar dashboard")
      }
    }

    loadDashboard()
  }, [inventarioId])

  const chartData = useMemo(() => {
    if (!report?.graficoDivergencias) return []

    return report.graficoDivergencias.map((item) => ({
      sku: item.sku,
      descricao: item.descricao,
      divergenciaTotal: Number(
        item.divergenciaTotal ?? item.divergenciatotal ?? 0
      )
    }))
  }, [report])

  const maxBarValue = useMemo(() => {
    if (!chartData.length) return 1
    return Math.max(...chartData.map((item) => item.divergenciaTotal), 1)
  }, [chartData])

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h1>Dashboard</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container">
        <div className="card">
          <h1>Dashboard</h1>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  const { resumo, rankingOperadores } = report

  return (
    <div className="container">
      <h1>Dashboard de Inventário</h1>

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Acuracidade</h3>
          <p className="metric-value">{resumo.acuracidade}%</p>
        </div>

        <div className="card metric-card">
          <h3>Total de Itens</h3>
          <p className="metric-value">{resumo.totalItens}</p>
        </div>

        <div className="card metric-card">
          <h3>Itens Divergentes</h3>
          <p className="metric-value">{resumo.itensDivergentes}</p>
        </div>

        <div className="card metric-card">
          <h3>Posições Finalizadas</h3>
          <p className="metric-value">{resumo.posicoesFinalizadas}</p>
        </div>
      </div>

      <div className="layout">
        <div className="card">
          <h2>Avanço de Itens</h2>
          <p>
            {resumo.itensContados} de {resumo.totalItens} itens contados
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${resumo.percentualItensContados}%` }}
            />
          </div>
          <p>{resumo.percentualItensContados}%</p>
        </div>

        <div className="card">
          <h2>Avanço de Posições</h2>
          <p>
            {resumo.posicoesFinalizadas} de {resumo.totalPosicoes} posições finalizadas
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${resumo.percentualPosicoesContadas}%` }}
            />
          </div>
          <p>{resumo.percentualPosicoesContadas}%</p>
        </div>
      </div>

      <div className="layout">
        <div className="card">
          <h2>Status das Posições</h2>
          <p><strong>Finalizadas:</strong> {resumo.posicoesFinalizadas}</p>
          <p><strong>Em recontagem:</strong> {resumo.posicoesRecontagem}</p>
          <p><strong>Em andamento:</strong> {resumo.posicoesEmAndamento}</p>
        </div>

        <div className="card">
          <h2>Conferência</h2>
          <p><strong>Itens corretos:</strong> {resumo.itensCorretos}</p>
          <p><strong>Itens divergentes:</strong> {resumo.itensDivergentes}</p>
          <p><strong>Total de itens contados:</strong> {resumo.itensContados}</p>
        </div>
      </div>

      <div className="layout">
        <div className="card">
          <h2>Gráfico de Barras — Top SKUs Divergentes</h2>

          {chartData.length === 0 && (
            <p>Nenhuma divergência encontrada.</p>
          )}

          {chartData.map((item) => {
            const width = maxBarValue > 0
              ? (item.divergenciaTotal / maxBarValue) * 100
              : 0

            return (
              <div key={item.sku} className="bar-chart-row">
                <div className="bar-chart-label">
                  <strong>{item.sku}</strong>
                  <span title={item.descricao}>{item.descricao}</span>
                </div>

                <div className="bar-chart-track">
                  <div
                    className="bar-chart-fill"
                    style={{ width: `${width}%` }}
                  />
                </div>

                <div className="bar-chart-value">
                  {item.divergenciaTotal}
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <h2>Ranking de Operadores</h2>

          {rankingOperadores.length === 0 && (
            <p>Nenhuma contagem registrada ainda.</p>
          )}

          {rankingOperadores.length > 0 && (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Operador</th>
                    <th>Total</th>
                    <th>Corretas</th>
                    <th>Divergentes</th>
                    <th>% Acerto</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingOperadores.map((item) => (
                    <tr key={item.operador}>
                      <td>{item.operador}</td>
                      <td>{item.totalContagens}</td>
                      <td>{item.contagensCorretas}</td>
                      <td>{item.contagensDivergentes}</td>
                      <td>{item.percentualAcerto}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage