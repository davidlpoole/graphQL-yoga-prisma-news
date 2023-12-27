import { makeExecutableSchema } from '@graphql-tools/schema'
import { v4 as uuidv4 } from 'uuid'

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

type Link = {
  id: string
  url: string
  description: string
}

const links: Link[] = [
  {
    id: 'link-54b97299-d361-45e7-bdbc-3e5226528f84',
    url: 'https://graphql-yoga.com',
    description: 'The easiest way of setting up a GraphQL server',
  },
]

const resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: () => links,
  },
  Mutation: {
    postLink: (parent: unknown, args: { description: string; url: string }) => {
      const id = uuidv4()

      const link: Link = {
        id: `link-${id}`,
        description: args.description,
        url: args.url,
      }

      links.push(link)

      return link
    },
  },
}

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
})
