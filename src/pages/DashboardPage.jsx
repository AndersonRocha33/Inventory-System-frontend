import { useCallback, useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function DashboardPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.get(`/${inventarioId}/report`)
      setReport(response.data)
      setError("")
    } catch {
      setError("Erro ao carregar dashboard")
    }
  }, [inventarioId])

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [loadDashboard])

  if (error) {
    return <div className="exec-dashboard-page"><h1>{error}</h1></div>
  }

  if (!report) {
    return <div className="exec-dashboard-page"><h1>Carregando...</h1></div>
  }

  const { resumo, rankingOperadores } = report

  return (
    <div className="exec-dashboard-page">
      <p className="exec-eyebrow">Gestão do inventário</p>
      <h1 className="exec-title">Dashboard Executivo</h1>

      <div className="exec-card-grid">
        <Card destaque titulo="Acuracidade atual" valor={`${resumo.acuracidadeAtual}%`} texto="Somente posições finalizadas" />
        <Card titulo="Itens contados" valor={resumo.itensContados} texto={`${resumo.percentualItensContados}% do total`} />
        <Card titulo="Posições finalizadas" valor={`${resumo.posicoesFinalizadas}/${resumo.totalPosicoes}`} texto={`${resumo.percentualPosicoesContadas}% concluído`} />
        <Card alerta titulo="Divergências abertas" valor={resumo.divergenciasAbertas} texto="Aguardando recontagem" />

        <Card titulo="Total de itens" valor={resumo.totalItens} texto="Grandeza do inventário" />
        <Card titulo="Itens extras" valor={resumo.itensExtras} texto="Encontrados a mais" />
        <Card titulo="Itens divergentes" valor={resumo.itensDivergentesAvaliados} texto="Nas posições finalizadas" />
        <Card titulo="Projeção final" valor={`${resumo.projecaoFinal}%`} texto="Tendência com base no realizado" />
      </div>

      <div className="exec-two-columns">
        <ProgressCard
          titulo="Avanço de Itens"
          texto={`${resumo.itensContados} de ${resumo.totalItens} itens contados`}
          percentual={resumo.percentualItensContados}
        />

        <ProgressCard
          titulo="Avanço de Posições"
          texto={`${resumo.posicoesFinalizadas} de ${resumo.totalPosicoes} posições finalizadas`}
          percentual={resumo.percentualPosicoesContadas}
        />
      </div>

      <div className="exec-two-columns">
        <div className="exec-panel">
          <h2>Status das Posições</h2>
          <p><strong>Pendentes:</strong> {resumo.posicoesPendentes}</p>
          <p><strong>Em andamento:</strong> {resumo.posicoesEmAndamento}</p>
          <p><strong>Em recontagem:</strong> {resumo.posicoesRecontagem}</p>
          <p><strong>Finalizadas:</strong> {resumo.posicoesFinalizadas}</p>
        </div>

        <div className="exec-panel">
          <h2>Ranking de Operadores</h2>

          {rankingOperadores.length === 0 && <p>Nenhuma contagem registrada ainda.</p>}

          {rankingOperadores.length > 0 && (
            <table className="exec-table">
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
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ titulo, valor, texto, destaque, alerta }) {
  return (
    <div className={`exec-card ${destaque ? "exec-card-destaque" : ""} ${alerta ? "exec-card-alerta" : ""}`}>
      <h3>{titulo}</h3>
      <strong>{valor}</strong>
      <p>{texto}</p>
    </div>
  )
}

function ProgressCard({ titulo, texto, percentual }) {
  return (
    <div className="exec-panel">
      <h2>{titulo}</h2>
      <p>{texto}</p>

      <div className="exec-progress">
        <div style={{ width: `${Math.min(Number(percentual), 100)}%` }} />
      </div>

      <p>{percentual}%</p>
    </div>
  )
}

export default DashboardPage