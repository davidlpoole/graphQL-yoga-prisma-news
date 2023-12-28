import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLContext } from './context'
import { Link, Comment } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { GraphQLError } from 'graphql'

const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
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
    feed: (
      parent: unknown,
      args: { filterNeedle?: string; skip: number; take: number },
      context: GraphQLContext
    ) => {
      const where = args.filterNeedle
        ? {
            OR: [
              { description: { contains: args.filterNeedle } },
              { url: { contains: args.filterNeedle } },
            ],
          }
        : {}

      const take = applyMinMaxConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
        name: 'take',
      })

      const skip = applyMinMaxConstraints({
        min: 0,
        value: args.skip ?? 0,
        name: 'skip',
      })

      return context.prisma.link.findMany({
        where,
        skip,
        take,
      })
    },
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
      const postUrl = isValidUrl(args.url)
      if (!postUrl)
        return new GraphQLError(`Cannot post link with invalid url ${args.url}`)
      const newLink = await context.prisma.link.create({
        data: {
          description: args.description,
          url: postUrl.href,
        },
      })
      return newLink
    },
    async postCommentOnLink(
      parent: unknown,
      args: { linkId: string; body: string },
      context: GraphQLContext
    ) {
      const linkId = parseIntSafe(args.linkId)
      if (!args.body) throw new GraphQLError('Comment must not be blank')
      if (!linkId)
        throw new GraphQLError(
          `Cannot post comment on link with invalid id '${args.linkId}'.`
        )
      const newComment = await context.prisma.comment
        .create({
          data: {
            linkId: linkId,
            body: args.body,
          },
        })
        .catch((err: unknown) => {
          console.log('yo', err)
          if (
            err instanceof PrismaClientKnownRequestError &&
            err.code === 'P2003'
          ) {
            return Promise.reject(
              new GraphQLError(
                `Cannot post comment on non-existing link with id '${args.linkId}'.`
              )
            )
          }
          return Promise.reject(err)
        })
      return newComment
    },
  },
}

function parseIntSafe(value: string): number | null {
  if (/^(\d+)$/.test(value)) {
    return parseInt(value, 10)
  }
  return null
}

function isValidUrl(urlString: string) {
  try {
    return new URL(urlString)
  } catch (e) {
    return null
  }
}

function applyMinMaxConstraints(params: {
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

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
