export const createAnimations = () => ({
  animations: {},
  presence: {},
})

export const useAnimatedNumber = (initial = 0) => ({
  current: initial,
  set: () => {},
})

export default { createAnimations, useAnimatedNumber }
