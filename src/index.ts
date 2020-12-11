import { GraphQLServer, PubSub } from 'graphql-yoga';

interface IMessage {
	id: number;
	user: string;
	content: string;
}

let messages: IMessage[] = [];
//	typeDefs
const typeDefs = `
  type Query {
    hello(name: String): String!
    messages: [Message!]
  }
  type Mutation{
      postMessage(user:String!, content:String!): ID!
  }
  type Message{
    id: ID!
    user: String!
    content: String!
  }
  type Subscription {
	  messages : [Message!]
  }
  
`;
//	subscribe to post
const subscribers: Function[] = [];
const onMessagesUpdates = (fn: Function) => subscribers.push(fn);

const resolvers = {
	Query: {
		hello: (): string => 'Hello  World',
		messages: (): IMessage[] => messages,
	},

	Mutation: {
		postMessage: (_: void, args: { user: string; content: string }): number => {
			const id: number = messages.length;
			messages.push({
				id: id,
				user: args.user,
				content: args.content,
			});
			subscribers.forEach((e) => e());
			return id;
		},
	},
	Subscription: {
		messages: {
			subscribe: (prt: void, args: void, ctx: { pubsub: PubSub }) => {
				const channel = Math.random().toString(36).slice(2, 15);

				onMessagesUpdates(() => pubsub.publish(channel, { messages }));
				setTimeout(() => {
					pubsub.publish(channel, { messages });
				}, 0);

				return pubsub.asyncIterator(channel);
			},
		},
	},
};
//	start server/sub
const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => console.log(`Server is running on http://localhost:${port}`));
