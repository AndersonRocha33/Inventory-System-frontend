import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function getStatusLabel(status) {
  const labels = {
    pendente: "Pendente",
    contando: "Em contagem",
    recontagem: "Recontagem",
    finalizado: "Finalizado"
  }

  return labels[status] || status
}

function PositionsPage() {
  const params = new URLSearchParams(window.location.search)

  const inventarioId = params.get("inventarioId") || ""
  const operador = params.get("operador") || ""

  const [positions, setPositions] = useState([])
  const [statusFilter, setStatusFilter] = useState("todos")
  const [positionFilter, setPositionFilter] = useState("")
  const [message, setMessage] = useState("")

  async function loadPositions() {
    if (!inventarioId) return

    try {
      const response = await api.get(`/${inventarioId}/positions`)
      setPositions(response.data)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar posições"
      )
    }
  }

  function getReviewPhase(position) {
    if (position.primeiro_operador === operador) return 1
    if (position.segundo_operador === operador) return 2
    if (position.terceiro_operador === operador) return 3
    return position.fase_atual || 1
  }

  function operatorAlreadyCounted(position) {
    return (
      position.primeiro_operador === operador ||
      position.segundo_operador === operador ||
      position.terceiro_operador === operador
    )
  }

  async function openCountPage(position) {
    try {
      if (!operador || !operador.trim()) {
        setMessage("Operador não informado")
        return
      }

      const alreadyCounted = operatorAlreadyCounted(position)
      const isRecount = position.status === "recontagem"

      if (alreadyCounted && isRecount) {
        const reviewPhase = getReviewPhase(position)

        window.location.href = `/count?mode=review&positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
          operador
        )}&reviewPhase=${reviewPhase}`

        return
      }

      if (position.status === "contando" && position.operador_atual === operador) {
        window.location.href = `/count?mode=count&positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
          operador
        )}`

        return
      }

      await api.post(`/positions/${position.id}/start`, {
        operador
      })

      window.location.href = `/count?mode=count&positionId=${position.id}&inventarioId=${inventarioId}&operador=${encodeURIComponent(
        operador
      )}`
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao iniciar contagem"
      )
    }
  }

  async function finishInventory() {
    const confirmed = window.confirm("Deseja finalizar este inventário?")

    if (!confirmed) return

    try {
      await api.post(`/${inventarioId}/finish`)
      setMessage("Inventário finalizado")
      await loadPositions()
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao finalizar inventário"
      )
    }
  }

  function goBack() {
    window.location.href = `/?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operador
    )}`
  }

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesStatus =
        statusFilter === "todos" ? true : position.status === statusFilter

      const matchesPosition = String(position.codigo || "")
        .toLowerCase()
        .includes(positionFilter.trim().toLowerCase())

      return matchesStatus && matchesPosition
    })
  }, [positions, statusFilter, positionFilter])

  useEffect(() => {
    loadPositions()

    const interval = setInterval(() => {
      loadPositions()
    }, 30000)

    return () => clearInterval(interval)
  }, [inventarioId])

  return (
    <div className="positions-page">
      <header className="positions-header">
        <div>
          <p className="eyebrow">Inventário #{inventarioId}</p>
          <h1>Posições</h1>
          <span>Operador: {operador}</span>
        </div>

        <div className="positions-header-actions">
          <button className="secondary-button" onClick={goBack}>
            Voltar
          </button>

          <button onClick={finishInventory}>
            Finalizar inventário
          </button>
        </div>
      </header>

      {message && <div className="toast-message">{message}</div>}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Filtros</h3>
            <p>Busque rapidamente uma posição para contagem.</p>
          </div>
        </div>

        <div className="filters-row">
          <div>
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="contando">Contando</option>
              <option value="recontagem">Recontagem</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>

          <div>
            <label>Posição</label>
            <input
              type="text"
              placeholder="Ex.: K.01.4"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Lista de posições</h3>
            <p>{filteredPositions.length} resultado(s)</p>
          </div>
        </div>

        <div className="positions-grid">
          {filteredPositions.map((position) => {
            const alreadyCounted = operatorAlreadyCounted(position)
            const isRecount = position.status === "recontagem"

            const isLockedByOther =
              position.status === "contando" &&
              position.operador_atual &&
              position.operador_atual !== operador

            return (
              <div key={position.id} className="position-card">
                <div className="position-card-top">
                  <div>
                    <strong>{position.codigo}</strong>
                    <span className={`status-badge status-${position.status}`}>
                      {getStatusLabel(position.status)}
                    </span>
                  </div>

                  <span className="phase-pill">Fase {position.fase_atual}</span>
                </div>

                <div className="position-meta">
                  <p>1º contador: {position.primeiro_operador || "-"}</p>
                  <p>2º contador: {position.segundo_operador || "-"}</p>
                  <p>3º contador: {position.terceiro_operador || "-"}</p>
                </div>

                {isLockedByOther && (
                  <div className="locked-info">
                    Em uso por {position.operador_atual}
                  </div>
                )}

                <button
                  onClick={() => openCountPage(position)}
                  disabled={!operador || isLockedByOther}
                >
                  {alreadyCounted && isRecount
                    ? "Revisar posição"
                    : Number(position.fase_atual || 1) > 1
                    ? "Abrir recontagem"
                    : position.status === "finalizado"
                    ? "Revisar posição"
                    : position.status === "contando" &&
                      position.operador_atual === operador
                    ? "Continuar contagem"
                    : "Abrir contagem"}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default PositionsPage