import React, { useState, useEffect } from "react";
import "./styles.css";

const GRID_SIZE = 8;

export default function BattleGrid({ playerStats, enemies, onBattleEnd }) {
  const [units, setUnits] = useState([
    {
      ...playerStats,
      name: "Hero",
      maxHp: playerStats.hp,
      moveRange: 3,
      id: "player",
    },
    ...enemies.map((e, i) => ({
      ...e,
      name: `Enemy ${i + 1}`,
      maxHp: e.hp,
      moveRange: 2,
    })),
  ]);
  const [currentUnitIdx, setCurrentUnitIdx] = useState(0);
  const [selectedAction, setSelectedAction] = useState(null);
  const [highlightTiles, setHighlightTiles] = useState([]);
  const [hoverTile, setHoverTile] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [hasAttacked, setHasAttacked] = useState(false);

  const currentUnit = units[currentUnitIdx];

  useEffect(() => {
    if (currentUnit && currentUnit.id !== "player") {
      const timer = setTimeout(() => executeEnemyTurn(), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentUnitIdx]);

  const endTurn = (updatedUnits) => {
    const player = updatedUnits.find((u) => u.id === "player");
    if (!player || player.hp <= 0) {
      alert("GAME OVER - The Hero has fallen.");
      window.location.reload();
      return;
    }
    setSelectedAction(null);
    setHighlightTiles([]);
    setHasMoved(false);
    setHasAttacked(false);
    setCurrentUnitIdx((prev) => (prev + 1) % updatedUnits.length);
  };

  const executeEnemyTurn = () => {
    const player = units.find((u) => u.id === "player");
    if (!player) return;

    const dx = Math.sign(player.position.x - currentUnit.position.x);
    const dy = Math.sign(player.position.y - currentUnit.position.y);
    const nextX = currentUnit.position.x + dx;
    const nextY = currentUnit.position.y + dy;

    const isOccupied = units.some(
      (u) => u.position.x === nextX && u.position.y === nextY
    );
    const newPos = isOccupied
      ? { ...currentUnit.position }
      : { x: nextX, y: nextY };

    let finalUnits = units.map((u) =>
      u.id === currentUnit.id ? { ...u, position: newPos } : u
    );
    const distToPlayer =
      Math.abs(newPos.x - player.position.x) +
      Math.abs(newPos.y - player.position.y);

    if (distToPlayer <= 1) {
      finalUnits = finalUnits.map((u) =>
        u.id === "player" ? { ...u, hp: Math.max(0, u.hp - 10) } : u
      );
    }

    setUnits(finalUnits);
    endTurn(finalUnits);
  };

  const getHighlightTiles = (type) => {
    const tiles = [];
    let range =
      type === "Move" ? currentUnit.moveRange : type === "Melee" ? 1 : 4;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist =
          Math.abs(currentUnit.position.x - x) +
          Math.abs(currentUnit.position.y - y);
        if (dist <= range && dist > 0) {
          if (type === "Move") {
            const isOccupied = units.some(
              (u) => u.position.x === x && u.position.y === y
            );
            if (!isOccupied) tiles.push({ x, y });
          } else {
            tiles.push({ x, y });
          }
        }
      }
    }
    setHighlightTiles(tiles);
    setSelectedAction(type);
  };

  const getSplatterTiles = (cx, cy) => {
    return [
      { x: cx, y: cy },
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 },
    ];
  };

  const handleTileClick = (x, y) => {
    if (
      currentUnit.id !== "player" ||
      !highlightTiles.some((t) => t.x === x && t.y === y)
    )
      return;

    let updated = [...units];
    let movedThisClick = false;
    let attackedThisClick = false;

    if (selectedAction === "Move") {
      updated = units.map((u) =>
        u.id === "player" ? { ...u, position: { x, y } } : u
      );
      movedThisClick = true;
    } else {
      const targets =
        selectedAction === "Melee" ? [{ x, y }] : getSplatterTiles(x, y);
      const dmg = selectedAction === "Melee" ? 15 : 8;
      updated = units
        .map((u) => {
          const isHit = targets.some(
            (t) => t.x === u.position.x && t.y === u.position.y
          );
          return isHit && u.id !== "player"
            ? { ...u, hp: Math.max(0, u.hp - dmg) }
            : u;
        })
        .filter((u) => u.hp > 0 || u.id === "player");
      attackedThisClick = true;
    }

    setUnits(updated);
    setSelectedAction(null);
    setHighlightTiles([]);

    if (!updated.some((u) => u.id !== "player")) {
      alert("Victory!");
      onBattleEnd();
      return;
    }

    const newHasMoved = hasMoved || movedThisClick;
    const newHasAttacked = hasAttacked || attackedThisClick;
    setHasMoved(newHasMoved);
    setHasAttacked(newHasAttacked);

    if (newHasMoved && newHasAttacked) {
      endTurn(updated);
    }
  };

  return (
    <div className="battle-container" onMouseLeave={() => setHoverTile(null)}>
      <div className="turn-order-bar">
        {units.map((u, idx) => (
          <div
            key={u.id}
            className={`turn-portrait ${
              idx === currentUnitIdx ? "active-turn" : ""
            }`}
          >
            <div
              className={`portrait-circle ${
                u.id === "player" ? "p-circle" : "e-circle"
              }`}
            />
            <span>{u.name}</span>
          </div>
        ))}
      </div>

      <div className="sidebar left">
        <h3>Combatants</h3>
        {units.map((u) => (
          <div key={u.id} className="unit-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ color: u.id === "player" ? "#4ade80" : "#f87171" }}
              >
                {u.name}
              </span>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                {u.hp} / {u.maxHp}
              </span>
            </div>
            <div className="hp-bar-bg">
              <div
                className="hp-bar-fill"
                style={{
                  width: `${(u.hp / u.maxHp) * 100}%`,
                  background: u.id === "player" ? "#22c55e" : "#ef4444",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="wrapper">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 60px)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const unit = units.find(
              (u) => u.position.x === x && u.position.y === y
            );
            const inRange = highlightTiles.some((t) => t.x === x && t.y === y);
            const isHovered = hoverTile?.x === x && hoverTile?.y === y;

            let isSplatter = false;
            if (
              selectedAction === "Ranged" &&
              hoverTile &&
              highlightTiles.some(
                (t) => t.x === hoverTile.x && t.y === hoverTile.y
              )
            ) {
              isSplatter = getSplatterTiles(hoverTile.x, hoverTile.y).some(
                (s) => s.x === x && s.y === y
              );
            }

            return (
              <div
                key={i}
                className={`tile 
                  ${inRange ? "in-range" : ""} 
                  ${inRange && isHovered ? "tile-hover" : ""} 
                  ${isSplatter ? "splatter-preview" : ""} 
                  ${unit?.id === "player" ? "player-base" : ""} 
                  ${unit?.id !== "player" && unit ? "enemy-base" : ""}
                `}
                onMouseEnter={() => setHoverTile({ x, y })}
                onClick={() => handleTileClick(x, y)}
              >
                {unit && (
                  <div
                    className={`character-sprite ${
                      unit.id === "player" ? "player" : "enemy"
                    }`}
                  >
                    {unit.id === "player" && (
                      <div className="status-indicators">
                        {!hasMoved && <div className="dot move-dot" />}
                        {!hasAttacked && <div className="dot attack-dot" />}
                      </div>
                    )}
                    <div className="visual-head" />
                    <div className="visual-body" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar right">
        <h3>Actions</h3>
        {currentUnit.id === "player" ? (
          <>
            <button
              onClick={() => getHighlightTiles("Move")}
              disabled={hasMoved}
              className={hasMoved ? "btn-disabled" : ""}
            >
              {hasMoved ? "Moved" : "Move"}
            </button>
            <hr style={{ borderColor: "#334155", margin: "15px 0" }} />
            <button
              onClick={() => getHighlightTiles("Melee")}
              disabled={hasAttacked}
              className={hasAttacked ? "btn-disabled" : ""}
            >
              Melee Attack
            </button>
            <button
              onClick={() => getHighlightTiles("Ranged")}
              disabled={hasAttacked}
              className={hasAttacked ? "btn-disabled" : ""}
            >
              Splatter Shot
            </button>
            <button onClick={() => endTurn(units)}>End Turn</button>
          </>
        ) : (
          <p>Enemy Thinking...</p>
        )}
      </div>
    </div>
  );
}
