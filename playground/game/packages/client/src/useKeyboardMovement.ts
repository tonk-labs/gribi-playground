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
        console.log("setting bomb")
        const position = await getPlayerPosition();

        console.log("position", position);

        // commit the position of the player (assume x and y are both 2 digits)
        const positionInt = position.x * 100 + position.y;
        console.log("positionInt", positionInt);
        await createCommitment(positionInt);
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [moveBy]);
};
