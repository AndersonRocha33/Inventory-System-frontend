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

  const maxBarValue = useMemo(() => {
    if (!report?.graficoDivergencias?.length) return 1
    return Math.max(...report.graficoDivergencias.map((item) => Number(item.divergenciaTotal || 0)), 1)
  }, [report])

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

  const { resumo, top10Divergentes, graficoDivergencias, rankingOperadores } = report

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
          <p>{resumo.itensContados} de {resumo.totalItens} itens contados</p>
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
          <p>{resumo.posicoesFinalizadas} de {resumo.totalPosicoes} posições finalizadas</p>
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

          {graficoDivergencias.length === 0 && (
            <p>Nenhuma divergência encontrada.</p>
          )}

          {graficoDivergencias.map((item) => {
            const width = (Number(item.divergenciaTotal) / maxBarValue) * 100

            return (
              <div key={item.sku} className="bar-chart-row">
                <div className="bar-chart-label">
                  <strong>{item.sku}</strong>
                  <span>{item.descricao}</span>
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

      <div className="card">
        <h2>Top 10 Itens Divergentes</h2>

        {top10Divergentes.length === 0 && <p>Nenhuma divergência encontrada.</p>}

        {top10Divergentes.map((item) => (
          <div key={`${item.posicao}-${item.sku}`} className="dashboard-row">
            <strong>{item.sku}</strong> - {item.descricao}
            <p>Posição: {item.posicao}</p>
            <p>
              Sistema: {item.quantidade_sistema} | Contado: {item.quantidade_contada}
            </p>
            <p><strong>Diferença:</strong> {item.diferencaAbsoluta}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage