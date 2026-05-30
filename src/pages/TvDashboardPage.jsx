import { useCallback, useEffect, useState } from "react"
import api from "../services/api"

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
    return <div style={styles.page}><h1>{error}</h1></div>
  }

  if (!report) {
    return <div style={styles.page}><h1>Carregando dashboard...</h1></div>
  }

  const { resumo, rankingOperadores } = report

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>SpotInventory</div>
          <h1 style={styles.title}>Dashboard TV/CD</h1>
          <p style={styles.subtitle}>Inventário #{inventarioId}</p>
        </div>

        <div style={styles.badge}>Atualização automática</div>
      </header>

      <section style={styles.grid}>
        <Card title="Acuracidade atual" value={`${resumo.acuracidadeAtual}%`} subtitle="Somente posições finalizadas" highlight />
        <Card title="Itens contados" value={resumo.itensContados} subtitle={`${resumo.percentualItensContados}% do total`} />
        <Card title="Posições finalizadas" value={`${resumo.posicoesFinalizadas}/${resumo.totalPosicoes}`} subtitle={`${resumo.percentualPosicoesContadas}% concluído`} />
        <Card title="Divergências abertas" value={resumo.divergenciasAbertas} subtitle="Aguardando recontagem" warning />
      </section>

      <section style={styles.grid}>
        <Card title="Operadores ativos" value={resumo.operadoresAtivos} subtitle="Últimos 30 minutos" />
        <Card title="Última hora" value={`+${resumo.itensUltimaHora}`} subtitle="Itens contados" />
        <Card title="Previsão término" value={formatDateTime(resumo.previsaoTermino)} subtitle="Baseado no ritmo atual" />
        <Card title="Itens extras" value={resumo.itensExtras} subtitle="Encontrados a mais" />
      </section>

      <section style={styles.progressPanel}>
        <div style={styles.progressHeader}>
          <span>Progresso geral das posições</span>
          <strong>{resumo.percentualPosicoesContadas}%</strong>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(Number(resumo.percentualPosicoesContadas), 100)}%`
            }}
          />
        </div>
      </section>

      <section style={styles.bottomGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Status das posições</h2>

          <div style={styles.statusGrid}>
            <Status label="Pendentes" value={resumo.posicoesPendentes} />
            <Status label="Em andamento" value={resumo.posicoesEmAndamento} />
            <Status label="Recontagem" value={resumo.posicoesRecontagem} />
            <Status label="Finalizadas" value={resumo.posicoesFinalizadas} />
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Ranking operadores</h2>

          {rankingOperadores.slice(0, 5).map((item, index) => (
            <div key={item.operador} style={styles.rankingRow}>
              <span>{index + 1}. {item.operador}</span>
              <strong>{item.percentualAcerto}%</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Card({ title, value, subtitle, highlight, warning }) {
  return (
    <div
      style={{
        ...styles.card,
        ...(highlight ? styles.highlightCard : {}),
        ...(warning ? styles.warningCard : {})
      }}
    >
      <span style={styles.cardTitle}>{title}</span>
      <strong style={highlight ? styles.bigValue : styles.value}>{value}</strong>
      <p style={styles.cardSubtitle}>{subtitle}</p>
    </div>
  )
}

function Status({ label, value }) {
  return (
    <div style={styles.statusItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111827",
    color: "#ffffff",
    padding: "34px",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  },
  logo: {
    color: "#f5ff4f",
    fontWeight: 900,
    fontSize: "22px",
    letterSpacing: "0.12em",
    textTransform: "uppercase"
  },
  title: {
    fontSize: "58px",
    margin: "6px 0"
  },
  subtitle: {
    fontSize: "26px",
    margin: 0,
    color: "#cbd5e1"
  },
  badge: {
    border: "1px solid #f5ff4f",
    color: "#f5ff4f",
    padding: "14px 22px",
    borderRadius: "999px",
    fontWeight: 900,
    fontSize: "20px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "22px",
    marginBottom: "22px"
  },
  card: {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 16px 34px rgba(0,0,0,.25)"
  },
  highlightCard: {
    border: "2px solid #f5ff4f"
  },
  warningCard: {
    border: "2px solid #f59e0b"
  },
  cardTitle: {
    color: "#dbeafe",
    fontSize: "22px",
    fontWeight: 900
  },
  value: {
    display: "block",
    color: "#f5ff4f",
    fontSize: "56px",
    margin: "16px 0 8px"
  },
  bigValue: {
    display: "block",
    color: "#f5ff4f",
    fontSize: "74px",
    margin: "16px 0 8px"
  },
  cardSubtitle: {
    color: "#cbd5e1",
    fontSize: "18px",
    margin: 0
  },
  progressPanel: {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "28px",
    padding: "28px",
    marginBottom: "22px"
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "26px",
    fontWeight: 900,
    marginBottom: "18px"
  },
  progressTrack: {
    height: "32px",
    background: "#111827",
    borderRadius: "999px",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    background: "#f5ff4f",
    borderRadius: "999px"
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px"
  },
  panel: {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "28px",
    padding: "30px"
  },
  panelTitle: {
    fontSize: "34px",
    marginTop: 0
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  statusItem: {
    background: "#111827",
    borderRadius: "20px",
    padding: "20px"
  },
  rankingRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#111827",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "12px",
    fontSize: "22px"
  }
}

export default TvDashboardPage