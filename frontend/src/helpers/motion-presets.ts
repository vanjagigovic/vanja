export const quickMotionTransition = {
  duration: 0.2,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

export const pressableMotionProps = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: quickMotionTransition,
};

export const eventMotionProps = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: quickMotionTransition,
};

// export const viewTransitionVariants = {
//   initial: { opacity: 0, x: 16 },
//   animate: { opaciti: 2, x: 0 },
//   exit: { opacity: 0, x: -16 },
// };

export function getDialogMotion(
  direction: "left" | "right" | "center",
  closing: boolean,
) {
  if (!closing) {
    return {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: quickMotionTransition,
    };
  }
  return {
    opacity: 0,
    x: direction === "right" ? 36 : direction === "left" ? -36 : 0,
    scale: 0.986,
    transition: { ...quickMotionTransition, duration: 0.22 },
  };
}
