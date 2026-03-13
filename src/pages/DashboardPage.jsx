import { useEffect, useState } from "react"
import api from "../services/api"
import "../index.css"

function DashboardPage() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  const params = new URLSearchParams(window.location.search)
  const inventarioId = params.get("inventarioId") || "1"

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get(`/${inventarioId}/report`)
        setReport(response.data)
      } catch (err) {
        console.error(err)
        setError("Erro ao carregar dashboard")
      }
    }

    loadDashboard()
  }, [inventarioId])

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

  const { resumo, top10Divergentes } = report

  return (
    <div className="container">
      <h1>Mini Dashboard de Acuracidade</h1>

      <div className="layout">
        <div className="card">
          <h2>Resumo</h2>
          <p><strong>Acuracidade:</strong> {resumo.acuracidade}%</p>
          <p><strong>Total de itens:</strong> {resumo.totalItens}</p>
          <p><strong>Total de itens contados:</strong> {resumo.itensContados}</p>
          <p><strong>Itens corretos:</strong> {resumo.itensCorretos}</p>
          <p><strong>Itens divergentes:</strong> {resumo.itensDivergentes}</p>
        </div>

        <div className="card">
          <h2>Avanço do inventário</h2>
          <p><strong>Total de posições:</strong> {resumo.totalPosicoes}</p>
          <p><strong>Posições finalizadas:</strong> {resumo.posicoesFinalizadas}</p>
          <p><strong>Posições em recontagem:</strong> {resumo.posicoesRecontagem}</p>
          <p><strong>Posições em andamento:</strong> {resumo.posicoesEmAndamento}</p>
          <p><strong>% de itens contados:</strong> {resumo.percentualItensContados}%</p>
          <p><strong>% de posições já contadas:</strong> {resumo.percentualPosicoesContadas}%</p>
        </div>
      </div>

      <div className="card">
        <h2>Top 10 itens divergentes</h2>

        {top10Divergentes.length === 0 && <p>Nenhuma divergência encontrada.</p>}

        {top10Divergentes.map((item) => (
          <div key={item.item_id} className="dashboard-row">
            <strong>{item.sku}</strong> - {item.descricao}
            <p>Posição: {item.posicao}</p>
            <p>
              Sistema: {item.quantidade_sistema} | Contado: {item.quantidade_contada}
            </p>
            <p><strong>Diferença:</strong> {item.diferencaAbsoluta}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage