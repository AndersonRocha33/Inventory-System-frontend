import { useEffect, useMemo, useState } from "react"
import api from "../services/api"
import "../index.css"

function MobileCountPage() {
  const [position, setPosition] = useState(null)
  const [items, setItems] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [counts, setCounts] = useState({})
  const [extraItem, setExtraItem] = useState({
    sku: "",
    descricao: "",
    quantidade: ""
  })
  const [message, setMessage] = useState("")

  const params = new URLSearchParams(window.location.search)
  const positionId = params.get("positionId")
  const inventarioId = params.get("inventarioId") || "1"
  const operador = params.get("operador") || ""
  const mode = params.get("mode") || "count"
  const reviewPhase = Number(params.get("reviewPhase") || 0)

  const isReviewMode = mode === "review"

  async function loadPositionData() {
    try {
      const positionsResponse = await api.get(`/${inventarioId}/positions`)
      const currentPosition = positionsResponse.data.find(
        (p) => String(p.id) === String(positionId)
      )

      if (!currentPosition) {
        setMessage("Posição não encontrada")
        return
      }

      setPosition(currentPosition)

      const faseParaSalvos = isReviewMode
        ? reviewPhase || currentPosition.fase_atual
        : currentPosition.fase_atual

      const savedResponse = await api.get(`/positions/${positionId}/saved-items`, {
        params: { fase: faseParaSalvos }
      })

      const saved = savedResponse.data
      setSavedItems(saved)

      if (isReviewMode) {
        setItems([])
        return
      }

      let activeResponse

      if (Number(currentPosition.fase_atual || 1) > 1) {
        activeResponse = await api.get(`/positions/${positionId}/divergent-items`)
      } else {
        activeResponse = await api.get(`/positions/${positionId}/items`)
      }

      const savedIds = new Set(saved.map((item) => String(item.id)))
      const activeItems = activeResponse.data.filter(
        (item) => !savedIds.has(String(item.id))
      )

      setItems(activeItems)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao carregar dados da posição"
      )
    }
  }

  async function registerCount(itemId) {
    try {
      const value = counts[itemId]

      if (value === undefined || value === "") {
        setMessage("Informe a quantidade antes de salvar")
        return false
      }

      const faseOverride = isReviewMode ? reviewPhase : undefined

      await api.post(`/items/${itemId}/count`, {
        operador,
        quantidade: Number(value),
        fase: faseOverride
      })

      const savedItem = items.find((item) => item.id === itemId)

      if (savedItem) {
        setSavedItems((prev) => [
          ...prev,
          {
            ...savedItem,
            quantidade_contada: Number(value),
            operador,
            fase: faseOverride
          }
        ])

        setItems((prev) => prev.filter((item) => item.id !== itemId))
      }

      setMessage("Item salvo")
      return true
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao registrar contagem"
      )
      return false
    }
  }

  async function registerCountAndNext(itemId) {
    const success = await registerCount(itemId)

    if (!success) return

    setTimeout(() => {
      const nextInput = document.querySelector(".mobile-count-input")
      if (nextInput) nextInput.focus()
    }, 100)
  }

  function editSavedItem(item) {
    setCounts((prev) => ({
      ...prev,
      [item.id]: item.quantidade_contada
    }))

    setItems((prev) => [item, ...prev])
    setSavedItems((prev) => prev.filter((saved) => saved.id !== item.id))
    setMessage("Item liberado para edição")
  }

  async function addExtraItem() {
    if (!position) return

    if (!extraItem.sku || !extraItem.descricao || !extraItem.quantidade) {
      setMessage("Preencha SKU, descrição e quantidade do item extra")
      return
    }

    try {
      await api.post(`/positions/${position.id}/extra-item`, {
        sku: extraItem.sku,
        descricao: extraItem.descricao,
        quantidade: Number(extraItem.quantidade),
        operador
      })

      setMessage("Item extra adicionado")
      setExtraItem({ sku: "", descricao: "", quantidade: "" })
      await loadPositionData()
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao adicionar item extra"
      )
    }
  }

  async function finishPosition() {
    if (!position) return

    if (isReviewMode) {
      goBack()
      return
    }

    if (items.length > 0) {
      const confirmed = window.confirm(
        `Ainda existem ${items.length} item(ns) pendente(s). Deseja finalizar mesmo assim?`
      )

      if (!confirmed) return
    }

    try {
      const response = await api.post(`/positions/${position.id}/finish`)
      setMessage(response.data.message || "Posição finalizada")

      setTimeout(() => {
        goBack()
      }, 1000)
    } catch (error) {
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro ao finalizar posição"
      )
    }
  }

  function goBack() {
    window.location.href = `/?inventarioId=${inventarioId}&operador=${encodeURIComponent(
      operador
    )}`
  }

  const progress = useMemo(() => {
    const total = items.length + savedItems.length
    const done = savedItems.length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0

    return { total, done, percent }
  }, [items, savedItems])

  useEffect(() => {
    loadPositionData()
  }, [positionId])

  if (!position) {
    return (
      <div className="mobile-count-shell">
        <div className="mobile-count-card">
          <h1>Contagem</h1>
          <p>{message || "Carregando..."}</p>
          <button onClick={goBack}>Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-count-shell">
      <header className="mobile-count-header">
        <div className="mobile-count-top">
          <button className="secondary-button" onClick={goBack}>
            Voltar
          </button>

          <button onClick={finishPosition}>
            {isReviewMode ? "Fechar revisão" : "Finalizar"}
          </button>
        </div>

        <div className="mobile-count-title">
          <span>{isReviewMode ? "Revisão" : "Contagem"}</span>
          <h1>{position.codigo}</h1>
        </div>

        <div className="mobile-count-info">
          <div>
            <span>Operador</span>
            <strong>{operador}</strong>
          </div>

          <div>
            <span>Fase</span>
            <strong>{isReviewMode ? reviewPhase : position.fase_atual}</strong>
          </div>

          <div>
            <span>Itens</span>
            <strong>{progress.done}/{progress.total}</strong>
          </div>
        </div>

        <div className="mobile-progress-wrapper">
          <div className="mobile-progress-bar">
            <div
              className="mobile-progress-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <span>{progress.percent}% concluído</span>
        </div>

        {isReviewMode && (
          <div className="mobile-mode-alert">
            Revisão dos itens já salvos
          </div>
        )}

        {!isReviewMode && Number(position.fase_atual || 1) > 1 && (
          <div className="mobile-mode-alert">
            Recontagem: exibindo apenas itens divergentes
          </div>
        )}
      </header>

      {message && <div className="mobile-toast">{message}</div>}

      <main className="mobile-count-main">
        <section className="mobile-section">
          <div className="mobile-section-header">
            <div>
              <h2>Itens pendentes</h2>
              <p>{items.length} item(ns) para contar</p>
            </div>
          </div>

          {items.length === 0 && (
            <div className="empty-state">
              Nenhum item pendente.
            </div>
          )}

          {items.map((item) => (
            <article key={item.id} className="mobile-product-card">
              <div className="mobile-product-header">
                <span className="sku-pill">{item.sku}</span>
              </div>

              <p className="product-description">{item.descricao}</p>

              <label>Quantidade física</label>
              <input
                className="mobile-count-input"
                type="number"
                inputMode="numeric"
                placeholder="Digite a quantidade"
                value={counts[item.id] || ""}
                onChange={(e) =>
                  setCounts({
                    ...counts,
                    [item.id]: e.target.value
                  })
                }
              />

              <div className="mobile-actions-row">
                <button onClick={() => registerCount(item.id)}>
                  Salvar
                </button>

                <button
                  className="secondary-button"
                  onClick={() => registerCountAndNext(item.id)}
                >
                  Salvar e próximo
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="mobile-section">
          <div className="mobile-section-header">
            <div>
              <h2>Itens salvos</h2>
              <p>{savedItems.length} item(ns) salvos</p>
            </div>
          </div>

          {savedItems.length === 0 && (
            <div className="empty-state">
              Nenhum item salvo ainda.
            </div>
          )}

          {savedItems.map((item) => (
            <article key={item.id} className="mobile-product-card saved">
              <div className="mobile-product-header">
                <span className="sku-pill">{item.sku}</span>
                <span className="saved-badge">Salvo</span>
              </div>

              <p className="product-description">{item.descricao}</p>

              <div className="saved-quantity">
                <span>Qtd salva</span>
                <strong>{item.quantidade_contada}</strong>
              </div>

              <button onClick={() => editSavedItem(item)}>
                Editar item
              </button>
            </article>
          ))}
        </section>

        {!isReviewMode && (
          <section className="mobile-section">
            <div className="mobile-section-header">
              <div>
                <h2>Item encontrado a mais</h2>
                <p>Use quando o item físico não está listado.</p>
              </div>
            </div>

            <div className="mobile-product-card">
              <label>SKU</label>
              <input
                type="text"
                placeholder="Código do item"
                value={extraItem.sku}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    sku: e.target.value
                  })
                }
              />

              <label>Descrição</label>
              <input
                type="text"
                placeholder="Descrição do item"
                value={extraItem.descricao}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    descricao: e.target.value
                  })
                }
              />

              <label>Quantidade</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="Quantidade"
                value={extraItem.quantidade}
                onChange={(e) =>
                  setExtraItem({
                    ...extraItem,
                    quantidade: e.target.value
                  })
                }
              />

              <button onClick={addExtraItem}>
                Adicionar item extra
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default MobileCountPage