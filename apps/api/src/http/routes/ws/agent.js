"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentWs = agentWs;
const dashboard_connections_1 = require("@/realtime/dashboard-connections");
async function agentWs(app) {
    app.get('/ws/agent', { websocket: true }, (conn) => {
        console.log('Agent conectado');
        conn.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.type !== 'TEMPERATURE_READING')
                    return;
                const { controllerId, temperature } = data.payload;
                // 1️⃣ Salvar no banco
                // await prisma.temperatureReading.create({
                //   data: {
                //     controllerId,
                //     temperature,
                //   },
                // })
                // 2️⃣ Enviar em tempo real para dashboards
                const payload = JSON.stringify({
                    controllerId,
                    temperature,
                });
                dashboard_connections_1.dashboardConnections.forEach((ws) => {
                    ws.send(payload);
                });
            }
            catch (err) {
                console.error('Erro no WS do agent:', err);
            }
        });
        conn.on('close', () => {
            console.log('Agent desconectado');
        });
    });
}
