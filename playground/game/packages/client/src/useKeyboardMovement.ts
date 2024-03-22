import { useEffect } from "react";
import { useMUD } from "./MUDContext";

export const useKeyboardMovement = () => {
  const {
    systemCalls: { createCommitment, moveBy, getPlayerPosition },
  } = useMUD();

  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        moveBy(0, -1);
      }
      if (e.key === "ArrowDown") {
        moveBy(0, 1);
      }
      if (e.key === "ArrowLeft") {
        moveBy(-1, 0);
      }
      if (e.key === "ArrowRight") {
        moveBy(1, 0);
      }
      if (e.key === "w") {
        // get the position of the player
        const position = await getPlayerPosition();

        // commit the position of the player
        const positionStr = position.x + "," + position.y;
        await createCommitment(positionStr);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [moveBy]);
};
