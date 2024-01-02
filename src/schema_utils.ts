import { GraphQLError } from 'graphql'

export function parseIntSafe(value: string): number | null {
  if (/^(\d+)$/.test(value)) {
    return parseInt(value, 10)
  }
  return null
}
export function isValidUrl(urlString: string) {
  try {
    return new URL(urlString)
  } catch (e) {
    return null
  }
}
export function applyMinMaxConstraints(params: {
  min: number
  max?: number
  value: number
  name: string
}) {
  if (!params.max && params.value < params.min) {
    throw new GraphQLError(
      `'${params.name}' argument value '${params.value}' must be greater than '${params.min}'.`
    )
  } else if (
    params.max &&
    (params.value < params.min || params.value > params.max)
  ) {
    throw new GraphQLError(
      `'${params.name}' argument value '${params.value}' must be between '${params.min}' to '${params.max}'.`
    )
  }
  return params.value
}
