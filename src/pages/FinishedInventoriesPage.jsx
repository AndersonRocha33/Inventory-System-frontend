import { useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR")
}

function FinishedInventoriesPage() {
  const [inventories, setInventories] = useState([])
  const [message, setMessage] = useState("")

  async function loadInventories() {
    try {
      const response = await api.get("/")
      const finished = response.data.filter(
        (inventory) =>
          inventory.status === "finalizado" ||
          inventory.arquivado === true
      )

      setInventories(finished)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar inventários finalizados"
      )
    }
  }

  function openDashboard(inventarioId) {
    window.open(
      `${window.location.origin}/dashboard?inventarioId=${inventarioId}`,
      "_blank"
    )
  }

  function openHistory(inventarioId) {
    window.open(
      `${window.location.origin}/history-report?inventarioId=${inventarioId}`,
      "_blank"
    )
  }

  function goBack() {
    window.location.href = "/"
  }

  useEffect(() => {
    loadInventories()
  }, [])

  return (
    <div className="positions-page">
      <header className="positions-header">
        <div>
          <p className="eyebrow">Histórico</p>
          <h1>Inventários finalizados</h1>
          <span>Consulte inventários já encerrados.</span>
        </div>

        <div className="positions-header-actions">
          <button className="secondary-button" onClick={goBack}>
            Voltar
          </button>
        </div>
      </header>

      {message && <div className="toast-message">{message}</div>}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Lista de inventários</h3>
            <p>{inventories.length} inventário(s) finalizado(s)</p>
          </div>
        </div>

        <div className="positions-grid">
          {inventories.map((inventory) => (
            <div key={inventory.id} className="position-card">
              <div className="position-card-top">
                <div>
                  <strong>{formatDate(inventory.data_inicio)}</strong>
                  <span className="status-badge status-finalizado">
                    Finalizado
                  </span>
                </div>

                <span className="phase-pill">ID {inventory.id}</span>
              </div>

              <div className="position-meta">
                <p>Depósito: {inventory.deposito || "-"}</p>
                <p>Cliente: {inventory.cliente || "-"}</p>
                <p>Finalizado em: {formatDate(inventory.finalizado_em)}</p>
              </div>

              <div className="mobile-actions-row">
                <button onClick={() => openDashboard(inventory.id)}>
                  Ver dashboard
                </button>

                <button
                  className="secondary-button"
                  onClick={() => openHistory(inventory.id)}
                >
                  Ver histórico
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default FinishedInventoriesPage