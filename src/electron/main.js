const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const isDev = process.env.NODE_ENV === 'development';

// Mantenha uma referência global do objeto da janela,
// se você não fizer isso, a janela será fechada automaticamente
// quando o objeto JavaScript for coletado pelo garbage collector.
let mainWindow;

function createWindow() {
  // Cria a janela do navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#121212', // Cor escura para o fundo durante o carregamento
  });

  // Em desenvolvimento, carrega a URL do Vite
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega o arquivo HTML construído
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Emitido quando a janela é fechada.
  mainWindow.on('closed', function () {
    // Dereferencia o objeto da janela, geralmente você armazenaria janelas
    // em um array se seu app suporta múltiplas janelas, este é o momento
    // quando você deve excluir o elemento correspondente.
    mainWindow = null;
  });
}

// Este método será chamado quando o Electron terminar a
// inicialização e estiver pronto para criar janelas do navegador.
// Algumas APIs podem ser usadas somente depois que este evento ocorre.
app.whenReady().then(createWindow);

// Sai quando todas as janelas estiverem fechadas.
app.on('window-all-closed', function () {
  // No MacOS é comum para aplicativos e sua barra de menu
  // permanecerem ativos até que o usuário saia explicitamente com Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  // No MacOS é comum recriar uma janela no aplicativo quando o
  // ícone na dock é clicado e não existem outras janelas abertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Configurando IPC para controle da janela
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Neste arquivo você pode incluir o restante do código principal
// de processos específicos do seu aplicativo. Você também pode
// colocá-los em arquivos separados e requeridos aqui. 