import { useEffect, useMemo, useState } from "react"
import api from "../services/api"

export default function SelectPositionsPage() {
  const params = new URLSearchParams(window.location.search)

  const inventarioId = params.get("inventarioId")

  const [positions, setPositions] = useState([])
  const [selectedPositions, setSelectedPositions] = useState([])
  const [filter, setFilter] = useState("")
  const [message, setMessage] = useState("")

  async function loadPositions() {
    try {
      const response = await api.get(`/${inventarioId}/positions`)

      setPositions(response.data)

      const selecionadas = response.data
        .filter((item) => item.selecionada_inventario)
        .map((item) => item.id)

      setSelectedPositions(selecionadas)
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.message ||
          "Erro ao carregar posições"
      )
    }
  }

  useEffect(() => {
    loadPositions()
  }, [])

  const filteredPositions = useMemo(() => {
    if (!filter.trim()) return positions

    const term = filter.toUpperCase()

    return positions.filter((item) =>
      item.codigo?.toUpperCase().includes(term)
    )
  }, [positions, filter])

  function togglePosition(id) {
    setSelectedPositions((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  function selectFiltered() {
    const ids = filteredPositions.map((item) => item.id)

    setSelectedPositions((current) => [
      ...new Set([...current, ...ids])
    ])
  }

  function removeFiltered() {
    const ids = filteredPositions.map((item) => item.id)

    setSelectedPositions((current) =>
      current.filter((item) => !ids.includes(item))
    )
  }

  function selectAll() {
    setSelectedPositions(positions.map((item) => item.id))
  }

  function clearAll() {
    setSelectedPositions([])
  }

  async function saveSelection() {
    try {
      await api.post(`/${inventarioId}/select-positions`, {
        positions: selectedPositions
      })

      setMessage("Seleção salva com sucesso")
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.message ||
          "Erro ao salvar seleção"
      )
    }
  }

  const total = positions.length

  const selected = selectedPositions.length

  const excluded = total - selected

  return (
    <div className="selection-page">
      <div className="selection-header">
        <button
          className="secondary-button"
          onClick={() => window.history.back()}
        >
          Voltar
        </button>

        <div>
          <h1>Selecionar posições do inventário</h1>

          <p>
            Selecione as posições que farão parte deste inventário.
            As posições não selecionadas não serão contadas.
          </p>
        </div>
      </div>

      {message && (
        <div className="toast-message">
          {message}
        </div>
      )}

      <div className="selection-layout">
        <div className="selection-left">
          <div className="panel">
            <h3>Filtro</h3>

            <p>
              Use para selecionar um corredor, rua ou grupo de posições.
            </p>

            <input
              placeholder="Ex.: K.01, L.25, AA"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />

            <div className="selection-actions">
              <button onClick={selectFiltered}>
                Selecionar filtradas
              </button>

              <button
                className="outline-action-button"
                onClick={removeFiltered}
              >
                Remover filtradas
              </button>

              <button
                className="blue-button"
                onClick={selectAll}
              >
                Selecionar todas
              </button>

              <button
                className="danger-button"
                onClick={clearAll}
              >
                Limpar tudo
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Posições importadas</h3>

            <p>{filteredPositions.length} resultado(s)</p>

            <div className="positions-grid-select">
              {filteredPositions.map((position) => {
                const selectedCard =
                  selectedPositions.includes(position.id)

                return (
                  <div
                    key={position.id}
                    className={`position-card-select ${
                      selectedCard
                        ? "selected-position"
                        : "excluded-position"
                    }`}
                    onClick={() => togglePosition(position.id)}
                  >
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={selectedCard}
                        readOnly
                      />
                    </div>

                    <div>
                      <strong>{position.codigo}</strong>

                      <span>
                        {selectedCard
                          ? "Selecionada"
                          : "Fora do inventário"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="selection-right">
          <div className="panel sticky-panel">
            <h3>Resumo da seleção</h3>

            <div className="selection-summary">
              <div>
                <span>Total importadas</span>
                <strong>{total}</strong>
                <small>posições</small>
              </div>

              <div>
                <span>Selecionadas</span>
                <strong>{selected}</strong>
                <small>posições</small>
              </div>

              <div>
                <span>Fora do inventário</span>
                <strong>{excluded}</strong>
                <small>posições</small>
              </div>
            </div>

            <button
              className="success-button full-width"
              onClick={saveSelection}
            >
              ✓ Salvar seleção
            </button>

            <div className="info-box">
              Você poderá alterar esta seleção a qualquer momento
              antes de iniciar as contagens.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}