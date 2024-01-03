import { createPubSub } from '@graphql-yoga/subscription'
import { Link } from '@prisma/client'

export type PubSubChannels = {
  newLink: [{ newLink: Link }]
}

export const pubSub = createPubSub<PubSubChannels>()
