import { useMemo, useState } from 'react'
import './App.css'

type Mark = 'X' | 'O'
type SquareValue = Mark | null

const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function calculateWinner(board: SquareValue[]): { winner: Mark; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }

  return null
}

function App() {
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null))
  const [isXTurn, setIsXTurn] = useState(true)
  const [lastMove, setLastMove] = useState<number | null>(null)

  const winnerData = useMemo(() => calculateWinner(board), [board])
  const isDraw = !winnerData && board.every(Boolean)
  const currentPlayer: Mark = isXTurn ? 'X' : 'O'

  const handleSquareClick = (index: number) => {
    if (board[index] || winnerData || isDraw) {
      return
    }

    const nextBoard = [...board]
    nextBoard[index] = currentPlayer

    setBoard(nextBoard)
    setIsXTurn((prev) => !prev)
    setLastMove(index)
  }

  const handleNewRound = () => {
    setBoard(Array(9).fill(null))
    setIsXTurn(true)
    setLastMove(null)
  }

  const statusText = winnerData
    ? `Winner: ${winnerData.winner}`
    : isDraw
      ? 'Draw game'
      : `Turn: ${currentPlayer}`

  return (
    <main className="app">
      <div className="aura aura--one" aria-hidden="true" />
      <div className="aura aura--two" aria-hidden="true" />

      <section className="game-shell">
        <header className="game-header">
          <p className="eyebrow">Neon Arena</p>
          <h1>Tic-Tac-Toe</h1>
          <p className="status" aria-live="polite">
            {statusText}
          </p>
        </header>

        <div className="board" role="grid" aria-label="Tic-Tac-Toe board">
          {board.map((value, index) => {
            const isWinningSquare = winnerData?.line.includes(index)

            return (
              <button
                key={index}
                type="button"
                className={`square ${isWinningSquare ? 'square--winner' : ''}`}
                onClick={() => handleSquareClick(index)}
                aria-label={`Cell ${index + 1}${value ? `, ${value}` : ''}`}
                disabled={Boolean(value) || Boolean(winnerData) || isDraw}
              >
                {value && (
                  <span className={`mark mark--${value} ${lastMove === index ? 'mark--placed' : ''}`}>
                    {value}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button type="button" className="reset-btn" onClick={handleNewRound}>
          New Round
        </button>
      </section>
    </main>
  )
}

export default App
