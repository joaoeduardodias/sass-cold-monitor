"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("@cold-monitor/env");
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify_1 = require("fastify");
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const fastify_websocket_1 = __importDefault(require("@/plugins/fastify-websocket"));
const error_handler_1 = require("./error-handler");
const authenticate_with_google_1 = require("./routes/auth/authenticate-with-google");
const authenticate_with_password_1 = require("./routes/auth/authenticate-with-password");
const create_user_1 = require("./routes/auth/create-user");
const get_profile_1 = require("./routes/auth/get-profile");
const request_password_recover_1 = require("./routes/auth/request-password-recover");
const reset_password_1 = require("./routes/auth/reset-password");
const generate_data_1 = require("./routes/data/generate-data");
const get_data_1 = require("./routes/data/get-data");
const update_data_1 = require("./routes/data/update-data");
const create_instrument_1 = require("./routes/instruments/create-instrument");
const create_join_instrument_1 = require("./routes/instruments/create-join-instrument");
const delete_instrument_1 = require("./routes/instruments/delete-instrument");
const delete_join_instrument_1 = require("./routes/instruments/delete-join-instrument");
const get_instrument_by_slug_1 = require("./routes/instruments/get-instrument-by-slug");
const get_instrument_with_join_instruments_1 = require("./routes/instruments/get-instrument-with-join-instruments");
const get_instruments_1 = require("./routes/instruments/get-instruments");
const get_join_instruments_1 = require("./routes/instruments/get-join-instruments");
const update_instrument_1 = require("./routes/instruments/update-instrument");
const accept_invite_1 = require("./routes/invites/accept-invite");
const create_invite_1 = require("./routes/invites/create-invite");
const get_invite_1 = require("./routes/invites/get-invite");
const get_invites_1 = require("./routes/invites/get-invites");
const get_pending_invites_1 = require("./routes/invites/get-pending-invites");
const reject_invite_1 = require("./routes/invites/reject-invite");
const revoke_invite_1 = require("./routes/invites/revoke-invite");
const get_member_1 = require("./routes/members/get-member");
const remove_member_1 = require("./routes/members/remove-member");
const update_member_1 = require("./routes/members/update-member");
const create_organization_1 = require("./routes/orgs/create-organization");
const get_organization_1 = require("./routes/orgs/get-organization");
const get_organizations_1 = require("./routes/orgs/get-organizations");
const update_organization_1 = require("./routes/orgs/update-organization");
const agent_1 = require("./routes/ws/agent");
const dashboard_1 = require("./routes/ws/dashboard");
const app = (0, fastify_1.fastify)().withTypeProvider();
app.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
app.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
app.setErrorHandler(error_handler_1.errorHandler);
app.register(cors_1.default);
app.register(fastify_websocket_1.default);
app.register(swagger_1.default, {
    openapi: {
        info: {
            title: 'Cold Monitor',
            description: 'App monitoring cold',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    transform: fastify_type_provider_zod_1.jsonSchemaTransform,
});
app.register(swagger_ui_1.default, {
    routePrefix: '/docs',
});
app.register(jwt_1.default, {
    secret: env_1.env.JWT_SECRET,
});
app.register(create_user_1.createUser);
app.register(authenticate_with_password_1.authenticateWithPassword);
app.register(authenticate_with_google_1.authenticateWithGoogle);
app.register(get_profile_1.getProfile);
app.register(request_password_recover_1.requestPasswordRecover);
app.register(reset_password_1.resetPassword);
app.register(get_organization_1.getOrganization);
app.register(get_organizations_1.getOrganizations);
app.register(update_organization_1.updateOrganization);
app.register(create_organization_1.createOrganization);
app.register(get_member_1.getMembers);
app.register(update_member_1.updateMember);
app.register(remove_member_1.removeMember);
app.register(create_invite_1.createInvite);
app.register(get_invite_1.getInvite);
app.register(get_invites_1.getInvites);
app.register(accept_invite_1.acceptInvite);
app.register(reject_invite_1.rejectInvite);
app.register(revoke_invite_1.revokeInvite);
app.register(get_pending_invites_1.getPendingInvites);
app.register(create_instrument_1.createInstrument);
app.register(update_instrument_1.updateInstrument);
app.register(delete_instrument_1.deleteInstrument);
app.register(get_instruments_1.getInstruments);
app.register(get_instrument_by_slug_1.getInstrumentBySlug);
app.register(create_join_instrument_1.createJoinInstrument);
app.register(delete_join_instrument_1.deleteJoinInstrument);
app.register(get_instrument_with_join_instruments_1.getInstrumentsWithJoinInstruments);
app.register(get_join_instruments_1.getJoinInstruments);
app.register(get_data_1.getData);
app.register(generate_data_1.generateData);
app.register(update_data_1.updateData);
app.register(dashboard_1.dashboardWs);
app.register(agent_1.agentWs);
app.listen({ port: env_1.env.PORT }).then(() => {
    console.log(`Server is running on http://localhost:${env_1.env.PORT}`);
});
