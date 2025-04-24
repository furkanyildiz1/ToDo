const electron = require("electron");
const { app, BrowserWindow, ipcMain, Notification } = electron;


//Uygulama hazır olduğunda çalışacak olan ana kod parçacısıdır.
app.on("ready", () => {

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: "Todo",
    roundedCorners: true,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      
    
    }
  });

  //Web içeriği yolu belirlenir. 
  mainWindow.loadFile("public/index.html");

  //Ana pencere kapatıldığında uygulamanın kapatılmasını sağlar.
  mainWindow.on("closed", () => {
    app.quit();
  });


  //Ana süreçten gelen belirli olayları dinler ve uygun bildirimleri oluşturur. 
  ipcMain.on("task-added", (event, arg) => {
    new Notification({
      title: "Task Added",
      body: arg,
    }).show();
  });
  ipcMain.on("task-deleted", (event, arg) => {
    new Notification({
      title: "Task deleted",
      body: arg,
    }).show();
  });
  ipcMain.on("task-completed", (event, arg) => {
    new Notification({
      title: "Task completed",
      body: arg,
    }).show();
  });
  ipcMain.on("task-notCompleted", (event, arg) => {
    new Notification({
      title: "Task notCompleted",
      body: arg,
    }).show();
  });
});
 