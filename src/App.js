import React, { useState, useEffect } from "react";
import BattleGrid from "./BattleGrid";
import "./styles.css";

const MAP_SIZE = 10;
// 0 = Grass, 1 = Rock/Tree (Obstacle)
const WORLD_MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

export default function App() {
  const [player, setPlayer] = useState({ x: 4, y: 4 });
  const [mode, setMode] = useState("explore");

  useEffect(() => {
    if (mode !== "explore") return;
    const move = (e) => {
      setPlayer((p) => {
        let n = { ...p };
        if (e.key === "ArrowUp") n.y--;
        if (e.key === "ArrowDown") n.y++;
        if (e.key === "ArrowLeft") n.x--;
        if (e.key === "ArrowRight") n.x++;

        // Check boundaries AND if the tile is a rock (1)
        if (
          n.x >= 0 &&
          n.x < MAP_SIZE &&
          n.y >= 0 &&
          n.y < MAP_SIZE &&
          WORLD_MAP[n.y][n.x] === 0
        ) {
          if (Math.random() < 0.08) setMode("battle");
          return n;
        }
        return p;
      });
    };
    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [mode]);

  if (mode === "battle") {
    return (
      <BattleGrid
        playerStats={{ id: "player", hp: 50, position: { x: 1, y: 1 } }}
        enemies={[{ id: "e1", hp: 25, position: { x: 6, y: 6 } }]}
        onBattleEnd={() => setMode("explore")}
      />
    );
  }

  return (
    <div className="wrapper">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${MAP_SIZE}, 60px)` }}
      >
        {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, i) => {
          const x = i % MAP_SIZE;
          const y = Math.floor(i / MAP_SIZE);
          const isP = player.x === x && player.y === y;
          const isObstacle = WORLD_MAP[y][x] === 1;
          return (
            <div
              key={i}
              className={`tile ${isP ? "player-base" : ""} ${
                isObstacle ? "obstacle" : ""
              }`}
            >
              {isP && (
                <div className="character-sprite player">
                  <div className="visual-head" />
                  <div className="visual-body" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
