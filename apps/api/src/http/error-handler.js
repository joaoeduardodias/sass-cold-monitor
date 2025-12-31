"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const v4_1 = require("zod/v4");
const bad_request_error_1 = require("./routes/_errors/bad-request-error");
const unauthorized_error_1 = require("./routes/_errors/unauthorized-error");
const errorHandler = (error, request, reply) => {
    if (error instanceof v4_1.ZodError) {
        return reply.status(400).send({
            message: error.message,
        });
    }
    if (error instanceof unauthorized_error_1.UnauthorizedError) {
        return reply.status(401).send({
            message: error.message,
        });
    }
    if (error instanceof bad_request_error_1.BadRequestError) {
        return reply.status(400).send({
            message: error.message,
        });
    }
    console.error(error);
    // send error to some observability platform
    return reply.status(500).send({ message: "Internal server error" });
};
exports.errorHandler = errorHandler;
