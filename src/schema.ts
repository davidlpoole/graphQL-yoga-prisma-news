import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLContext } from './context'
import { Link } from '@prisma/client'

const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed: [Link!]!
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
  }

  type Link {
    id: ID!
    description: String!
    url: String!
  }
`
const resolvers = {
  Query: {
    info: () => `This is the API of Hackernews Clone`,
    feed: (parent: unknown, args: {}, context: GraphQLContext) =>
      context.prisma.link.findMany(),
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
  },
  Mutation: {
    async postLink(
      parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext
    ) {
      return await context.prisma.link.create({
        data: {
          description: args.description,
          url: args.url,
        },
      })
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
