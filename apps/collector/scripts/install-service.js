const Service = require('node-windows').Service;
const path = require('path');

// Criar um novo objeto de serviço
const svc = new Service({
  name: 'Cold Monitor Collector',
  description: 'Serviço de coleta de dados Sitrad e envio para nuvem.',
  script: path.join(__dirname, '../dist-electron/main.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Escutar o evento "install", que indica que o
// processo está completo.
svc.on('install', function() {
  svc.start();
  console.log('Serviço instalado com sucesso!');
});

svc.install();
