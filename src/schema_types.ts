export const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed(filterNeedle: String, skip: Int, take: Int): [Link!]!
    comment(id: ID!): Comment
    link(id: ID!): Link
    me: User!
  }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
    signup(email: String!, password: String!, name: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }

  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!
    postedBy: User
  }

  type Comment {
    id: ID!
    body: String!
    link: Link!
  }

  type AuthPayload {
    token: String
    user: User
  }

  type User {
    id: String!
    name: String!
    email: String!
    links: [Link!]!
  }

  type Subscription {
    newLink: Link!
  }
`
