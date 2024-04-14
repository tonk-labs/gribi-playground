import { createSecretsState } from "@gribi/mud";
import { CommitSelector } from "./CommitUpdateReveal";

export type SecretState = {
    example: {
        secret: number
    }
}

export const privateState: () => SecretState = createSecretsState({
    example: {
        children: {
            secret: {
                selector: new CommitSelector(),
            }
        }
    }
});
