import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLContext } from './context'
import { Link } from '@prisma/client'

const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed: [Link!]!
    comment(id: ID!): Comment
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }

  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!
  }

  type Comment {
    id: ID!
    body: String!
  }
`
const resolvers = {
  Query: {
    info: () => `This is the API of Hackernews Clone`,
    feed: (parent: unknown, args: {}, context: GraphQLContext) =>
      context.prisma.link.findMany(),
    comment: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      context.prisma.comment.findUnique({
        where: { id: parseInt(args.id) },
      }),
  },
  Link: {
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    comments: (parent: Link, args: {}, context: GraphQLContext) =>
      context.prisma.comment.findMany({
        where: {
          linkId: parent.id,
        },
      }),
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
    async postCommentOnLink(
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext
    ) {
      return await context.prisma.comment.create({
        data: {
          linkId: parseInt(args.linkId),
          body: args.body,
        },
      })
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
