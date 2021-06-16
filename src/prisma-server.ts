import "reflect-metadata";

import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { resolvers } from "@generated/type-graphql";
import { PrismaClient } from "@prisma/client";

import { Server, ServerOptions } from "./server";
import { Partional } from "./types";

interface PrismaServerOptions extends ServerOptions {}

/**
 * A generic HTTP server with a Prisma database backend.
 */
export class WithPrismaServer<T extends WithPrismaServer<T>> extends Server<T> {
	/**
	 * The prisma database backend.
	 */
	readonly prisma = new PrismaClient();

	constructor(options: Partional<PrismaServerOptions>) {
		super(options);

		this.beforeListen(async () => await this.setupPrisma());
	}

	/**
	 * Set up the prisma database backend.
	 */
	async setupPrisma() {
		this.logger.verbose("Setting up prisma database...");
		// connect to database
		await this.prisma.$connect();
		// build the schema
		this.logger.debug("Building graphql schema...");
		const schema = await buildSchema({
			resolvers,
			validate: false,
		});
		// create the apollo server
		this.logger.debug("Attaching graphql middleware...");
		const server = new ApolloServer({ schema, playground: true, introspection: true });
		server.applyMiddleware({ app: this.express });
	}
}
