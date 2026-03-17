import { useState } from "react"
import axios from "axios"
import "../index.css"

function AuthPage() {
  const [mode, setMode] = useState("login")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const backendBaseUrl = import.meta.env.VITE_API_URL.replace("/inventory", "")

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setLoading(true)
      setMessage("")

      const url =
        mode === "login"
          ? `${backendBaseUrl}/auth/login`
          : `${backendBaseUrl}/auth/register`

      const payload =
        mode === "login"
          ? { email, senha }
          : { nome, email, senha }

      const response = await axios.post(url, payload)

      localStorage.setItem("inventory_user", JSON.stringify(response.data.user))
      localStorage.setItem("inventory_token", response.data.token)

      window.location.href = "/"
    } catch (error) {
      console.error(error)
      setMessage(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Erro de autenticação"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h1>{mode === "login" ? "Entrar" : "Cadastrar"}</h1>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="********"
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
              ? "Entrar"
              : "Cadastrar"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="auth-switch">
          {mode === "login" ? (
            <p>
              Não tem conta?{" "}
              <button
                className="link-button"
                onClick={() => setMode("register")}
              >
                Cadastre-se
              </button>
            </p>
          ) : (
            <p>
              Já tem conta?{" "}
              <button
                className="link-button"
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage