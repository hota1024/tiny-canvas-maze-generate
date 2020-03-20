// ライブラリの読み込み
import {
  TinyGame,
  CanvasRenderer,
  CanvasInputManager,
  AnimationFrameRequestTicker,
  TinyGrid,
  Point2D,
  KeyCode
} from 'tiny-canvas'

/**
 * タイルの種類
 */
enum TileType {
  // 棒（壁になる）
  Stick,
  // 壁
  Wall,
  // 道
  Road
}

/**
 * 方向ベクトル
 */
const Directions: Point2D[] = [
  // 右
  {
    x: 1,
    y: 0
  },
  // 下
  {
    x: 0,
    y: 1
  },
  // 左
  {
    x: -1,
    y: 0
  },
  // 上
  {
    x: 0,
    y: -1
  }
]

class Player {
  position: Point2D
  directionIndex: number

  get direction() {
    return Directions[this.directionIndex]
  }

  get leftDirectionIndex() {
    const index = this.directionIndex - 1
    return index < 0 ? Directions.length - 1 : index
  }

  get rightDirectionIndex() {
    return (this.directionIndex + 1) % Directions.length
  }

  get leftDirection() {
    return Directions[this.leftDirectionIndex]
  }

  get rightDirection() {
    return Directions[this.rightDirectionIndex]
  }

  get next() {
    return {
      x: this.position.x + this.direction.x,
      y: this.position.y + this.direction.y
    }
  }

  get left() {
    return {
      x: this.position.x + this.leftDirection.x,
      y: this.position.y + this.leftDirection.y
    }
  }

  get right() {
    return {
      x: this.position.x + this.rightDirection.x,
      y: this.position.y + this.rightDirection.y
    }
  }

  constructor(position: Point2D, directionIndex: number) {
    this.position = position
    this.directionIndex = directionIndex
  }

  turnRight() {
    this.directionIndex = this.rightDirectionIndex
  }

  turnLeft() {
    this.directionIndex = this.leftDirectionIndex
  }

  step(maze: TinyGrid<TileType>) {
    const next = this.next

    const frontTile = maze.get(next)

    /**
     * 右に壁があれば、前方を確認する
     */

    if (frontTile === TileType.Wall) {
      this.turnLeft()
    } else {
      this.position = next
    }

    const right = this.right
    const rightTile = maze.get(right)
    if (rightTile !== TileType.Wall) {
      this.turnRight()
    }
  }
}

/**
 * 迷路ゲーム
 */
export class MazeGame extends TinyGame {
  /**
   * 迷路のデータ
   */
  grid: TinyGrid<TileType>

  trace: TinyGrid<boolean>

  /**
   * タイルの大きさ
   */
  tileSize = 32

  /**
   * プレイヤー
   */
  player: Player

  /**
   * ゴールの位置
   */
  goalPosition: Point2D

  /**
   * ゴールしたかのフラグ
   */
  goal = false

  /**
   * カメラの位置
   */
  camera: Point2D = {
    x: 0,
    y: 0
  }

  /**
   * ズーム
   */
  zoom = 1

  /**
   * スピード
   */
  speedFrame = 5

  /**
   * コンストラクタ
   *
   * @param canvas
   * @param width
   * @param height
   */
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    super(
      new CanvasRenderer(canvas),
      new CanvasInputManager(canvas),
      new AnimationFrameRequestTicker()
    )

    this.grid = new TinyGrid(width, height)
    this.trace = new TinyGrid(width, height)
    this.trace.fill(false)

    this.player = new Player(
      {
        x: 1,
        y: 1
      },
      0
    )
    this.goalPosition = {
      x: width - 2,
      y: height - 2
    }

    this.generate()
  }

  /**
   * フレームの処理
   */
  onFrame() {
    this.update()
    this.draw()
  }

  /**
   * ローカル座標をグローバル座標に変形
   *
   * @param x
   * @param y
   */
  private worldPoint(x: number, y: number) {
    return {
      x: (x - this.camera.x * this.tileSize) * this.zoom + this.center.x,
      y: (y - this.camera.y * this.tileSize) * this.zoom + this.center.y
    }
  }

  /**
   * 更新処理
   */
  private update() {
    this.updateCamera()
    this.updateZoom()
    this.updateSpeedFrame()

    // ゴール処理
    if (
      this.player.position.x === this.goalPosition.x &&
      this.player.position.y === this.goalPosition.y
    ) {
      alert('ゴール！')
      return
    }
    if (this.ticker.currentFrames() % this.speedFrame === 0) {
      this.player.step(this.grid)
      this.trace.set(this.player.position.x, this.player.position.y, true)
    }
  }

  /**
   * カメラの更新
   */
  private updateCamera() {
    this.camera.x += (this.player.position.x - this.camera.x) / 5
    this.camera.y += (this.player.position.y - this.camera.y) / 5
  }

  /**
   * ズームの更新
   */
  private updateZoom() {
    if (this.keyDown(KeyCode.ArrowUp)) {
      this.zoom += 0.1
      if (this.zoom > 6) this.zoom = 6
    }

    if (this.keyDown(KeyCode.ArrowDown)) {
      this.zoom -= 0.1
      if (this.zoom < 0.1) this.zoom = 0.1
    }
  }

  /**
   * スピードフレームの更新
   */
  private updateSpeedFrame() {
    if (this.keyDown(KeyCode.ArrowRight)) {
      this.speedFrame += 1
      if (this.speedFrame > 60) this.speedFrame = 60
    }

    if (this.keyDown(KeyCode.ArrowLeft)) {
      this.speedFrame -= 1
      if (this.speedFrame < 1) this.speedFrame = 1
    }
  }

  /**
   * 描画処理
   */
  private draw() {
    // 画面を白でクリア
    this.fillRect(this.leftTop, this.rightBottom, 'white')

    // 迷路を描画
    this.grid.each((x, y, data) => {
      this.drawWorldTile(x, y, data === TileType.Wall ? 'black' : 'white')
      if (this.trace.get(x, y)) this.drawWorldTile(x, y, 'green')
    })

    // ゴール
    this.drawWorldTile(this.goalPosition.x, this.goalPosition.y, 'yellow')

    // プレイヤー
    this.drawWorldTile(
      this.player.position.x,
      this.player.position.y,
      '#00aaff'
    )
    this.fillCircle(
      this.worldPoint(
        this.player.next.x * this.tileSize + this.tileSize / 2,
        this.player.next.y * this.tileSize + this.tileSize / 2
      ),
      2,
      'red'
    )
    this.fillCircle(
      this.worldPoint(
        this.player.right.x * this.tileSize + this.tileSize / 2,
        this.player.right.y * this.tileSize + this.tileSize / 2
      ),
      2,
      'blue'
    )
  }

  /**
   * タイルを描画する
   *
   * @param x
   * @param y
   * @param color
   */
  drawWorldTile(x: number, y: number, color: string) {
    this.fillRect(
      this.worldPoint(x * this.tileSize, y * this.tileSize),
      (this.tileSize + 0.5) * this.zoom,
      (this.tileSize + 0.5) * this.zoom,
      color
    )
  }

  /**
   * 迷路を生成
   */
  generate() {
    this.grid
      // 道で埋める
      .fill(TileType.Road)

      // 端を壁にする
      .setEach((x, y) =>
        x === 0 ||
        x === this.grid.width - 1 ||
        y === 0 ||
        y === this.grid.height - 1
          ? TileType.Wall
          : TileType.Road
      )

      // 棒を設置する
      .setEach((x, y, data) => {
        if (
          x % 2 === 0 &&
          x > 0 &&
          x < this.grid.width - 1 &&
          y % 2 === 0 &&
          y > 0 &&
          y < this.grid.height - 1
        ) {
          return TileType.Stick
        }
        return data
      })

      // 棒を倒す
      .each((x, y, data) => {
        // 棒じゃないなら次の処理へ移る
        if (data !== TileType.Stick) return

        // 棒が倒れるまで繰り返す
        while (true as true) {
          // 棒を倒す方向を決める（一段目以降は上に倒さない）
          const directionIndex = Math.floor(Math.random() * (y > 2 ? 3 : 4))

          // 倒す方向のベクトルを取得
          const direction = Directions[directionIndex]
          const directionPoint = {
            x: x + direction.x,
            y: y + direction.y
          }

          // 倒す方向に壁があれば処理を最初から始める
          if (this.grid.get(directionPoint) === TileType.Wall) {
            continue
          }

          // 壁がなければ棒の位置に壁を置いて、倒す方向に壁を置く
          this.grid.set(x, y, TileType.Wall)
          this.grid.set(directionPoint, TileType.Wall)

          // 無限ループを抜ける
          break
        }
      })
  }
}
