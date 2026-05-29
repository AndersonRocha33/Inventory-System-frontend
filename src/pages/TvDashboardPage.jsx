import { useCallback, useEffect, useState } from "react"
import api from "../services/api"

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
    return (
      <div style={styles.page}>
        <h1>{error}</h1>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={styles.page}>
        <h1>Carregando dashboard...</h1>
      </div>
    )
  }

  const { resumo, rankingOperadores } = report

  const progressoPosicoes = Number(resumo.percentualPosicoesContadas || 0)
  const progressoItens = Number(resumo.percentualItensContados || 0)

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>SpotInventory</div>
          <h1 style={styles.title}>Dashboard TV/CD</h1>
          <p style={styles.subtitle}>Inventário #{inventarioId}</p>
        </div>

        <div style={styles.liveBadge}>Atualização automática</div>
      </header>

      <section style={styles.mainGrid}>
        <div style={{ ...styles.card, ...styles.featuredCard }}>
          <span style={styles.cardLabel}>Acuracidade atual</span>
          <strong style={styles.bigNumber}>{resumo.acuracidadeAtual}%</strong>
          <p style={styles.cardText}>Somente posições finalizadas</p>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Itens contados</span>
          <strong style={styles.number}>{resumo.itensContados}</strong>
          <p style={styles.cardText}>{resumo.percentualItensContados}% do total</p>
        </div>

        <div style={styles.card}>
          <span style={styles.cardLabel}>Posições finalizadas</span>
          <strong style={styles.number}>
            {resumo.posicoesFinalizadas}/{resumo.totalPosicoes}
          </strong>
          <p style={styles.cardText}>{resumo.percentualPosicoesContadas}% concluído</p>
        </div>

        <div style={{ ...styles.card, ...styles.warningCard }}>
          <span style={styles.cardLabel}>Divergências abertas</span>
          <strong style={styles.number}>{resumo.divergenciasAbertas}</strong>
          <p style={styles.cardText}>Aguardando recontagem</p>
        </div>
      </section>

      <section style={styles.progressSection}>
        <div style={styles.progressBox}>
          <div style={styles.progressHeader}>
            <span>Progresso das posições</span>
            <strong>{progressoPosicoes.toFixed(2)}%</strong>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(progressoPosicoes, 100)}%`
              }}
            />
          </div>
        </div>

        <div style={styles.progressBox}>
          <div style={styles.progressHeader}>
            <span>Progresso dos itens</span>
            <strong>{progressoItens.toFixed(2)}%</strong>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(progressoItens, 100)}%`
              }}
            />
          </div>
        </div>
      </section>

      <section style={styles.bottomGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Status das posições</h2>

          <div style={styles.statusGrid}>
            <div style={styles.statusItem}>
              <span>Pendentes</span>
              <strong>{resumo.posicoesPendentes}</strong>
            </div>

            <div style={styles.statusItem}>
              <span>Em andamento</span>
              <strong>{resumo.posicoesEmAndamento}</strong>
            </div>

            <div style={styles.statusItem}>
              <span>Recontagem</span>
              <strong>{resumo.posicoesRecontagem}</strong>
            </div>

            <div style={styles.statusItem}>
              <span>Finalizadas</span>
              <strong>{resumo.posicoesFinalizadas}</strong>
            </div>
          </div>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Ranking operadores</h2>

          {rankingOperadores.length === 0 && (
            <p style={styles.cardText}>Nenhuma contagem registrada.</p>
          )}

          {rankingOperadores.slice(0, 5).map((item, index) => (
            <div key={item.operador} style={styles.rankingRow}>
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
  eyebrow: {
    color: "#f5ff4f",
    fontWeight: "900",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "18px"
  },
  title: {
    fontSize: "58px",
    margin: "8px 0 4px"
  },
  subtitle: {
    fontSize: "26px",
    margin: 0,
    color: "#cbd5e1"
  },
  liveBadge: {
    border: "1px solid #f5ff4f",
    color: "#f5ff4f",
    borderRadius: "999px",
    padding: "14px 22px",
    fontWeight: "900",
    fontSize: "20px"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    gap: "22px",
    marginBottom: "22px"
  },
  card: {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "28px",
    padding: "30px",
    boxShadow: "0 14px 30px rgba(0,0,0,.25)"
  },
  featuredCard: {
    border: "2px solid #f5ff4f"
  },
  warningCard: {
    border: "2px solid #f59e0b"
  },
  cardLabel: {
    display: "block",
    color: "#dbeafe",
    fontSize: "24px",
    fontWeight: "900"
  },
  bigNumber: {
    display: "block",
    color: "#f5ff4f",
    fontSize: "86px",
    margin: "18px 0 8px"
  },
  number: {
    display: "block",
    color: "#f5ff4f",
    fontSize: "62px",
    margin: "18px 0 8px"
  },
  cardText: {
    color: "#cbd5e1",
    fontSize: "20px",
    margin: 0
  },
  progressSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
    marginBottom: "22px"
  },
  progressBox: {
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "28px",
    padding: "28px"
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "24px",
    fontWeight: "900",
    marginBottom: "18px"
  },
  progressTrack: {
    width: "100%",
    height: "28px",
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
    fontSize: "36px",
    margin: "0 0 22px"
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px"
  },
  statusItem: {
    background: "#111827",
    borderRadius: "20px",
    padding: "22px"
  },
  rankingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#111827",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "14px",
    fontSize: "24px"
  }
}

export default TvDashboardPage