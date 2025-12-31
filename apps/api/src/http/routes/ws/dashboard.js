"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardWs = dashboardWs;
const dashboard_connections_1 = require("@/realtime/dashboard-connections");
async function dashboardWs(app) {
    app.get('/ws/dashboard', { websocket: true }, (conn) => {
        console.log('Dashboard conectado');
        dashboard_connections_1.dashboardConnections.add(conn);
        conn.on('close', () => {
            dashboard_connections_1.dashboardConnections.delete(conn);
            console.log('Dashboard desconectado');
        });
    });
}
