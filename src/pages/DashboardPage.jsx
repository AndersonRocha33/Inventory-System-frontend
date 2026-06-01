import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ClipboardCheck,
  Package,
  PackagePlus,
  Target,
  TrendingUp,
  Users
} from "lucide-react"
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

    const interval = setInterval(() => {
      loadDashboard()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadDashboard])

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
      </div>

      <div className="dashboard-grid">
        <Metric icon={<Target />} title="Acuracidade atual" value={`${resumo.acuracidadeAtual}%`} subtitle="Somente posições finalizadas" />
        <Metric icon={<TrendingUp />} title="Projeção final" value={`${resumo.projecaoFinal}%`} subtitle="Tendência com base no realizado" />
        <Metric icon={<Package />} title="Itens contados" value={resumo.itensContados} subtitle={`${resumo.percentualItensContados}% do total`} />
        <Metric icon={<ClipboardCheck />} title="Posições finalizadas" value={resumo.posicoesFinalizadas} subtitle={`${resumo.percentualPosicoesContadas}% das posições`} />
      </div>

      <div className="dashboard-grid">
        <Metric icon={<PackagePlus />} title="Total de itens" value={resumo.totalItens} subtitle="Grandeza do inventário" />
        <Metric icon={<CheckCircle />} title="Itens extras" value={resumo.itensExtras} subtitle="Encontrados a mais" />
        <Metric icon={<AlertTriangle />} title="Divergências abertas" value={resumo.divergenciasAbertas} subtitle="Aguardando recontagem" />
        <Metric icon={<Activity />} title="Itens divergentes" value={resumo.itensDivergentesAvaliados} subtitle="Nas posições finalizadas" />
      </div>

      <div className="layout">
        <ProgressCard
          title="Avanço de Itens"
          text={`${resumo.itensContados} de ${resumo.totalItens} itens contados`}
          percent={resumo.percentualItensContados}
        />

        <ProgressCard
          title="Avanço de Posições"
          text={`${resumo.posicoesFinalizadas} de ${resumo.totalPosicoes} posições finalizadas`}
          percent={resumo.percentualPosicoesContadas}
        />
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
          <p><strong>Projeção final:</strong> {resumo.projecaoFinal}%</p>
          <p><strong>Divergências abertas:</strong> {resumo.divergenciasAbertas}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="table-title">
          <Users size={24} />
          Ranking de Operadores
        </h2>

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

function Metric({ icon, title, value, subtitle }) {
  return (
    <div className="card metric-card dashboard-metric-card">
      <div className="dashboard-metric-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p className="metric-value">{value}</p>
        <span>{subtitle}</span>
      </div>
    </div>
  )
}

function ProgressCard({ title, text, percent }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{text}</p>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(Number(percent), 100)}%` }}
        />
      </div>

      <p>{percent}%</p>
    </div>
  )
}

export default DashboardPage