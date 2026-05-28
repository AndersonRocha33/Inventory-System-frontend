import { useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function DashboardPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  async function loadDashboard() {
    try {
      const response = await api.get(`/${inventarioId}/report`)
      setReport(response.data)
      setError("")
    } catch {
      setError("Erro ao carregar dashboard")
    }
  }

  useEffect(() => {
    loadDashboard()

    const interval = setInterval(() => {
      loadDashboard()
    }, 30000)

    return () => clearInterval(interval)
  }, [inventarioId])

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
      <div className="dashboard-title-row">
        <div>
          <p className="eyebrow">Gestão do inventário</p>
          <h1>Dashboard Executivo</h1>
        </div>

        <button onClick={loadDashboard}>Atualizar agora</button>
      </div>

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Acuracidade atual</h3>
          <p className="metric-value">{resumo.acuracidadeAtual}%</p>
          <span>Somente posições finalizadas</span>
        </div>

        <div className="card metric-card">
          <h3>Total de itens</h3>
          <p className="metric-value">{resumo.totalItens}</p>
          <span>Grandeza total do inventário</span>
        </div>

        <div className="card metric-card">
          <h3>Itens contados</h3>
          <p className="metric-value">{resumo.itensContados}</p>
          <span>{resumo.percentualItensContados}% do total</span>
        </div>

        <div className="card metric-card">
          <h3>Itens extras</h3>
          <p className="metric-value">{resumo.itensExtras}</p>
          <span>Encontrados a mais</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Itens avaliados</h3>
          <p className="metric-value">{resumo.totalItensAvaliados}</p>
          <span>Base da acuracidade</span>
        </div>

        <div className="card metric-card">
          <h3>Itens corretos</h3>
          <p className="metric-value">{resumo.itensCorretosAvaliados}</p>
          <span>Nas posições finalizadas</span>
        </div>

        <div className="card metric-card">
          <h3>Itens divergentes</h3>
          <p className="metric-value">{resumo.itensDivergentesAvaliados}</p>
          <span>Nas posições finalizadas</span>
        </div>

        <div className="card metric-card">
          <h3>Posições finalizadas</h3>
          <p className="metric-value">{resumo.posicoesFinalizadas}</p>
          <span>{resumo.percentualPosicoesContadas}% das posições</span>
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
          <p><strong>Pendentes:</strong> {resumo.posicoesPendentes}</p>
          <p><strong>Em andamento:</strong> {resumo.posicoesEmAndamento}</p>
          <p><strong>Em recontagem:</strong> {resumo.posicoesRecontagem}</p>
          <p><strong>Finalizadas:</strong> {resumo.posicoesFinalizadas}</p>
        </div>

        <div className="card">
          <h2>Base da Acuracidade Atual</h2>
          <p><strong>Itens avaliados:</strong> {resumo.totalItensAvaliados}</p>
          <p><strong>Itens corretos:</strong> {resumo.itensCorretosAvaliados}</p>
          <p><strong>Itens divergentes:</strong> {resumo.itensDivergentesAvaliados}</p>
          <p><strong>Itens extras:</strong> {resumo.itensExtras}</p>
          <p><strong>Acuracidade atual:</strong> {resumo.acuracidadeAtual}%</p>
        </div>
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
  )
}

export default DashboardPage