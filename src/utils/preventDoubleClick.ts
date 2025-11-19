import { SyntheticEvent, useState } from "react";

export function usePreventDoubleClick(
  cb: () => void,
  delay?: number
): () => void;

export function usePreventDoubleClick<T>(
  cb: (arg: T) => void,
  delay?: number
): (arg: T) => void;

export function usePreventDoubleClick<T extends SyntheticEvent>(
  cb: (arg: T) => void,
  delay?: number
): (arg: T) => Promise<void>;

export function usePreventDoubleClick<TArgs extends unknown[]>(
  cb: (...args: TArgs) => void | Promise<void>,
  delay: number = 2000
) {
  const [disabled, setDisabled] = useState<boolean>(false);

  return (...args: TArgs): void | Promise<void> => {
    if (disabled) return;
    setDisabled(true);

    const result = cb(...args);
    const reset = () => setTimeout(() => setDisabled(false), delay);

    // If the cb returned a promise
    // wait for it to settle before re-enabling
    if (result && typeof result.then === "function") {
      return result.finally(reset);
    }

    reset();
    return result;
  };
}
