import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("pt-BR")
}

function FinishedInventoriesPage() {
  const [inventories, setInventories] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadInventories() {
    try {
      setLoading(true)

      const response = await api.get("/")

      const finished = response.data.filter(
        (inventory) =>
          inventory.status === "finalizado" || inventory.arquivado === true
      )

      const inventoriesWithReport = await Promise.all(
        finished.map(async (inventory) => {
          try {
            const reportResponse = await api.get(`/${inventory.id}/report`)

            return {
              ...inventory,
              resumo: reportResponse.data.resumo
            }
          } catch {
            return {
              ...inventory,
              resumo: null
            }
          }
        })
      )

      setInventories(inventoriesWithReport)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar inventários finalizados"
      )
    } finally {
      setLoading(false)
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

  const chartData = useMemo(() => {
    return inventories
      .map((inventory) => ({
        id: inventory.id,
        data: formatDate(inventory.data_inicio),
        deposito: inventory.deposito || "-",
        acuracidade: Number(inventory.resumo?.acuracidadeAtual || 0)
      }))
      .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
  }, [inventories])

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

      {loading && (
        <section className="panel">
          <p>Carregando histórico...</p>
        </section>
      )}

      {!loading && (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Evolução da acuracidade</h3>
                <p>Comparativo dos inventários finalizados por data.</p>
              </div>
            </div>

            {chartData.length === 0 && (
              <p>Nenhum inventário finalizado encontrado.</p>
            )}

            {chartData.length > 0 && (
              <div className="inventory-chart-card">
                <div className="inventory-chart-scale">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>

                <div className="inventory-vertical-chart">
                  {chartData.map((item) => {
                    const height = Math.max(2, item.acuracidade)

                    return (
                      <div key={item.id} className="inventory-chart-item">
                        <div className="inventory-chart-bar-wrapper">
                          <div
                            className="inventory-chart-bar"
                            style={{ height: `${height}%` }}
                          >
                            <span>{item.acuracidade.toFixed(0)}%</span>
                          </div>
                        </div>

                        <strong>{item.data}</strong>
                        <p>{item.deposito}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

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
                    <p>
                      Acuracidade:{" "}
                      <strong>
                        {inventory.resumo?.acuracidadeAtual || "0.00"}%
                      </strong>
                    </p>
                    <p>
                      Itens contados:{" "}
                      <strong>{inventory.resumo?.itensContados || 0}</strong>
                    </p>
                    <p>
                      Posições finalizadas:{" "}
                      <strong>
                        {inventory.resumo?.posicoesFinalizadas || 0}
                      </strong>
                    </p>
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
        </>
      )}
    </div>
  )
}

export default FinishedInventoriesPage