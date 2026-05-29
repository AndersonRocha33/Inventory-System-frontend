import { useCallback, useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function TvDashboardPage() {
  const [report, setReport] = useState(null)

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  const loadDashboard = useCallback(async () => {
    const response = await api.get(`/${inventarioId}/report`)
    setReport(response.data)
  }, [inventarioId])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadDashboard()
    }, 0)

    const interval = setInterval(() => {
      loadDashboard()
    }, 15000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [loadDashboard])

  if (!report) {
    return (
      <div className="tv-dashboard">
        <h1>Carregando dashboard...</h1>
      </div>
    )
  }

  const { resumo, rankingOperadores } = report

  return (
    <div className="tv-dashboard">
      <div className="tv-header">
        <div>
          <p>SpotInventory</p>
          <h1>Dashboard TV/CD</h1>
        </div>

        <div className="tv-clock">
          Inventário #{inventarioId}
        </div>
      </div>

      <div className="tv-grid">
        <div className="tv-card featured">
          <span>Acuracidade atual</span>
          <strong>{resumo.acuracidadeAtual}%</strong>
          <p>Somente posições finalizadas</p>
        </div>

        <div className="tv-card">
          <span>Itens contados</span>
          <strong>{resumo.itensContados}</strong>
          <p>{resumo.percentualItensContados}% do total</p>
        </div>

        <div className="tv-card">
          <span>Posições finalizadas</span>
          <strong>{resumo.posicoesFinalizadas}/{resumo.totalPosicoes}</strong>
          <p>{resumo.percentualPosicoesContadas}% concluído</p>
        </div>

        <div className="tv-card warning">
          <span>Divergências abertas</span>
          <strong>{resumo.divergenciasAbertas}</strong>
          <p>Aguardando recontagem</p>
        </div>
      </div>

      <div className="tv-bottom">
        <div className="tv-panel">
          <h2>Status das posições</h2>

          <div className="tv-status-list">
            <div>
              <span>Pendentes</span>
              <strong>{resumo.posicoesPendentes}</strong>
            </div>

            <div>
              <span>Em andamento</span>
              <strong>{resumo.posicoesEmAndamento}</strong>
            </div>

            <div>
              <span>Recontagem</span>
              <strong>{resumo.posicoesRecontagem}</strong>
            </div>

            <div>
              <span>Finalizadas</span>
              <strong>{resumo.posicoesFinalizadas}</strong>
            </div>
          </div>
        </div>

        <div className="tv-panel">
          <h2>Ranking operadores</h2>

          {rankingOperadores.slice(0, 5).map((item, index) => (
            <div key={item.operador} className="tv-ranking-row">
              <span>{index + 1}. {item.operador}</span>
              <strong>{item.percentualAcerto}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TvDashboardPage