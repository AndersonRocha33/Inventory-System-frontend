import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  Monitor,
  Package,
  RotateCcw,
  Users,
  Zap
} from "lucide-react"
import api from "../services/api"
import "../index.css"

function formatDateTime(value) {
  if (!value) return "Sem previsão"

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function TvDashboardPage() {
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
      setError("Erro ao carregar Painel CD")
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
      <div className="cd-panel-page">
        <h1>{error}</h1>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="cd-panel-page">
        <h1>Carregando Painel CD...</h1>
      </div>
    )
  }

  const { resumo, rankingOperadores } = report

  return (
    <div className="cd-panel-page">
      <header className="cd-panel-header">
        <div>
          <p className="cd-eyebrow">Acompanhamento operacional</p>
          <h1>Painel CD</h1>
          <span>Inventário #{inventarioId} • atualização automática a cada 30 segundos</span>
        </div>

        <div className="cd-live-badge">
          <Monitor size={26} />
          Ao vivo
        </div>
      </header>

      <section className="cd-progress-card">
        <div>
          <span>Progresso de posições</span>
          <strong>{resumo.percentualPosicoesContadas}%</strong>
        </div>

        <div className="cd-progress-bar">
          <div
            style={{
              width: `${Math.min(Number(resumo.percentualPosicoesContadas), 100)}%`
            }}
          />
        </div>

        <p>
          {resumo.posicoesFinalizadas} de {resumo.totalPosicoes} posições finalizadas
        </p>
      </section>

      <section className="cd-kpi-grid">
        <Kpi
          icon={<Package />}
          title="Pendentes"
          value={resumo.posicoesPendentes}
          subtitle="aguardando contagem"
        />

        <Kpi
          icon={<RotateCcw />}
          title="Em contagem"
          value={resumo.posicoesEmAndamento}
          subtitle="em andamento agora"
        />

        <Kpi
          icon={<AlertTriangle />}
          title="Recontagem"
          value={resumo.posicoesRecontagem}
          subtitle="com divergência"
          alert
        />

        <Kpi
          icon={<CheckCircle />}
          title="Finalizadas"
          value={resumo.posicoesFinalizadas}
          subtitle="concluídas"
        />
      </section>

      <section className="cd-kpi-grid cd-kpi-grid-small">
        <Kpi
          icon={<Users />}
          title="Operadores ativos"
          value={resumo.operadoresAtivos}
          subtitle="últimos 30 minutos"
        />

        <Kpi
          icon={<Zap />}
          title="Última hora"
          value={`+${resumo.itensUltimaHora}`}
          subtitle="itens contados"
        />

        <Kpi
          icon={<Clock3 />}
          title="Previsão término"
          value={formatDateTime(resumo.previsaoTermino)}
          subtitle="baseado no ritmo atual"
          wide
        />
      </section>

      <section className="cd-bottom-grid">
        <div className="cd-panel-card">
          <h2>Status operacional</h2>

          <div className="cd-status-list">
            <Status label="Pendentes" value={resumo.posicoesPendentes} />
            <Status label="Em contagem" value={resumo.posicoesEmAndamento} />
            <Status label="Recontagem" value={resumo.posicoesRecontagem} />
            <Status label="Finalizadas" value={resumo.posicoesFinalizadas} />
          </div>
        </div>

        <div className="cd-panel-card">
          <h2>Ranking rápido</h2>

          {rankingOperadores.length === 0 && (
            <p>Nenhuma contagem registrada ainda.</p>
          )}

          {rankingOperadores.slice(0, 5).map((item, index) => (
            <div className="cd-ranking-row" key={item.operador}>
              <span>
                {index + 1}. {item.operador}
              </span>

              <strong>{item.percentualAcerto}%</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Kpi({ icon, title, value, subtitle, alert, wide }) {
  return (
    <div className={`cd-kpi-card ${alert ? "cd-kpi-alert" : ""} ${wide ? "cd-kpi-wide" : ""}`}>
      <div className="cd-kpi-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <strong>{value}</strong>
        <p>{subtitle}</p>
      </div>
    </div>
  )
}

function Status({ label, value }) {
  return (
    <div className="cd-status-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default TvDashboardPage