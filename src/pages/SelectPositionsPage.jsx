import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function SelectPositionsPage() {
  const params = new URLSearchParams(window.location.search)

  const inventarioId = params.get("inventarioId") || ""
  const operador = params.get("operador") || ""

  const [positions, setPositions] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [filter, setFilter] = useState("")
  const [message, setMessage] = useState("")

  async function loadPositions() {
    try {
      const response = await api.get(`/${inventarioId}/positions/all`)

      setPositions(response.data)

      const initialSelected = response.data
        .filter((position) => position.incluida_no_inventario !== false)
        .map((position) => position.id)

      setSelectedIds(initialSelected)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar posições"
      )
    }
  }

  async function saveSelection() {
    try {
      await api.put(`/${inventarioId}/positions/selection`, {
        positionIds: selectedIds
      })

      setMessage("Posições selecionadas com sucesso")
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao salvar seleção"
      )
    }
  }

  function togglePosition(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }

      return [...prev, id]
    })
  }

  function selectFiltered() {
    const ids = filteredPositions.map((position) => position.id)

    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  function clearFiltered() {
    const ids = filteredPositions.map((position) => position.id)

    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
  }

  function selectAll() {
    setSelectedIds(positions.map((position) => position.id))
  }

  function clearAll() {
    setSelectedIds([])
  }

  function goBack() {
    window.location.href = `/?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operador
    )}`
  }

  const filteredPositions = useMemo(() => {
    const search = filter.trim().toLowerCase()

    if (!search) return positions

    return positions.filter((position) =>
      String(position.codigo || "").toLowerCase().includes(search)
    )
  }, [positions, filter])

  useEffect(() => {
    loadPositions()
  }, [inventarioId])

  return (
    <div className="positions-page">
      <header className="positions-header">
        <div>
          <p className="eyebrow">Inventário #{inventarioId}</p>
          <h1>Selecionar posições</h1>
          <span>
            Selecione as posições que farão parte do inventário. Para inventário geral,
            mantenha todas selecionadas.
          </span>
        </div>

        <div className="positions-header-actions">
          <button className="secondary-button" onClick={goBack}>
            Voltar
          </button>

          <button onClick={saveSelection}>
            Salvar seleção
          </button>
        </div>
      </header>

      {message && <div className="toast-message">{message}</div>}

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total importado</span>
          <strong>{positions.length}</strong>
          <p>posições</p>
        </div>

        <div className="summary-card">
          <span>Selecionadas</span>
          <strong>{selectedIds.length}</strong>
          <p>ativas no inventário</p>
        </div>

        <div className="summary-card">
          <span>Fora do inventário</span>
          <strong>{positions.length - selectedIds.length}</strong>
          <p>não serão contadas</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Filtro</h3>
            <p>Use para selecionar um corredor, rua ou grupo de posições.</p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Ex.: K.01, L.25, AA"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />

        <div className="actions">
          <button onClick={selectFiltered}>
            Selecionar filtradas
          </button>

          <button className="secondary-button" onClick={clearFiltered}>
            Remover filtradas
          </button>

          <button className="secondary-button" onClick={selectAll}>
            Selecionar todas
          </button>

          <button className="danger-button" onClick={clearAll}>
            Limpar tudo
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Posições importadas</h3>
            <p>{filteredPositions.length} resultado(s)</p>
          </div>
        </div>

        <div className="positions-grid">
          {filteredPositions.map((position) => {
            const checked = selectedIds.includes(position.id)

            return (
              <button
                key={position.id}
                type="button"
                className={`position-select-card ${
                  checked ? "position-select-card-active" : ""
                }`}
                onClick={() => togglePosition(position.id)}
              >
                <strong>{position.codigo}</strong>
                <span>{checked ? "Selecionada" : "Fora do inventário"}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default SelectPositionsPage