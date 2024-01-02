import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLContext } from './context'
import { Link, Comment } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { GraphQLError } from 'graphql'
import { typeDefinitions } from './schema_types'
import {
  applyMinMaxConstraints,
  isValidUrl,
  parseIntSafe,
} from './schema_utils'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { APP_SECRET } from './auth'

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
    async signup(
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) {
      const password = await hash(args.password, 10)
      const user = await context.prisma.user.create({
        data: { ...args, password },
      })
      const token = sign({ userId: user.id }, APP_SECRET)
      return { token, user }
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
