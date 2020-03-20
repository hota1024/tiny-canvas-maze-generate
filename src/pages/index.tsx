import Head from 'next/head'
import { useRef, useEffect } from 'react'
import { MazeGame } from '../maze'

const Home = () => {
  const canvasRef = useRef<HTMLCanvasElement>()

  useEffect(() => {
    const game = new MazeGame(canvasRef.current, 51, 51)
    game.start()
  })

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <h1>Maze</h1>
        <p>Up/Down: Zoom</p>
        <p>Left/Right: Speed</p>
      </div>
      <div>
        <canvas ref={canvasRef} width="640" height="480"></canvas>
      </div>

      <style global jsx>{`
        html,
        body {
          padding: 0;
          margin: 0;
          background: #101010;
          color: white;
        }

        .container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-flow: column wrap;
        }

        .text-center {
          text-align: center;
        }

        canvas {
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

export default Home
