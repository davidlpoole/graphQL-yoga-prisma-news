import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLContext } from './context'
import { Link, Comment } from '@prisma/client'

const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed: [Link!]!
    comment(id: ID!): Comment
    link(id: ID!): Link
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
    link: Link!
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
    link: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      context.prisma.link.findUnique({
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
  Comment: {
    id: (parent: Comment) => parent.id,
    body: (parent: Comment) => parent.body,
    link: async (parent: Comment, args: {}, context: GraphQLContext) => {
      if (parent.linkId) {
        const link = await context.prisma.link.findUnique({
          where: {
            id: parent.linkId,
          },
        })
        return link
      }
    },
  },
  Mutation: {
    async postLink(
      parent: unknown,
      args: { description: string; url: string },
      context: GraphQLContext
    ) {
      const newLink = await context.prisma.link.create({
        data: {
          description: args.description,
          url: args.url,
        },
      })
      return newLink
    },
    async postCommentOnLink(
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext
    ) {
      const newComment = await context.prisma.comment.create({
        data: {
          linkId: parseInt(args.linkId),
          body: args.body,
        },
      })
      return newComment
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
