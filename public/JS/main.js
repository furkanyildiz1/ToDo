const toDoInput = document.querySelector(".todo-input");
const toDoDate = document.querySelector(".todo-date");
const toDoPriority = document.querySelector(".todo-priority");
const toDoBtn = document.querySelector(".todo-btn");
const toDoList = document.querySelector(".todo-list");
const { ipcRenderer } = require("electron");

const standardTheme = document.querySelector(".standard-theme");
const lightTheme = document.querySelector(".light-theme");
const darkerTheme = document.querySelector(".darker-theme");

// Görevleri filtreleme işlemleri
document.getElementById("daily-btn").addEventListener("click", () => filterTasks("daily"));
document.getElementById("weekly-btn").addEventListener("click", () => filterTasks("weekly"));
document.getElementById("monthly-btn").addEventListener("click", () => filterTasks("monthly"));

// Tema işlemleri
standardTheme.addEventListener("click", () => changeTheme("standard"));
lightTheme.addEventListener("click", () => changeTheme("light"));
darkerTheme.addEventListener("click", () => changeTheme("darker"));

// Dosya aktarımı işlemleri
document.getElementById("export-tasks-btn").addEventListener("click", exportTasksToCSV);
document.getElementById("export-tasks-pdf-btn").addEventListener("click", exportTasksToPDF);
document.getElementById("import-tasks-btn").addEventListener("change", importTasksFromCSV);

let taskChart;
let totalTasks = 0;
let completedTasks = 0;
let incompleteTasks = 0;
toDoBtn.addEventListener("click", addToDo);
toDoList.addEventListener("click", deletecheck);

document.addEventListener("DOMContentLoaded", () => {
  loadTodos();
  updateTaskCounts();
  updateTaskChart();
});

// Kaydedilmiş tema bilgisinin alınması
let savedTheme = localStorage.getItem("savedTheme");
savedTheme === null
  ? changeTheme("standard")
  : changeTheme(localStorage.getItem("savedTheme"));

// Görev ekleme fonksiyonu
function addToDo(event) {
  event.preventDefault(); //Varsayılan davranışı engelleme

  // Input değerlerinin alınması
  const taskValue = toDoInput.value.trim(); // Görev metni
  const dateValue = new Date(toDoDate.value); // Görev tarihi
  const priorityValue = toDoPriority.value; // Görev önceliği

  // Giriş kontrolünün yapılması
  if (taskValue === "") {
    alert("You must write something!");
    return;
  }
  // Tarih kontrolünün yapılması
  if (isNaN(dateValue.getTime())) {
    alert("You must select a valid date!");
    return;
  }

  // Yeni görev nesnesinin oluşturulması
  const newToDoItem = {
    task: taskValue,
    creationDate: dateValue,
    priority: priorityValue,
    completed: false,
  };

  // Kayıtlı görevlerin alınması
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  // Aynı görevden olup olmadığının kontrolü
  const isDuplicate = todos.some((todo) => {
    return (
      todo.task === newToDoItem.task &&
      new Date(todo.creationDate).getTime() ===
        newToDoItem.creationDate.getTime() &&
      todo.priority === newToDoItem.priority
    );
  });

  // Benzersiz değilse uyarı ver ve işlemi durdur
  if (isDuplicate) {
    alert("This task already exists!");
    return;
  }

  // Yeni görevin eklenmesi ve kaydedilmesi
  todos.push(newToDoItem);
  todos.sort((a, b) => {
    const priorityOrder = ["high", "medium", "low"];
    return (
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );
  });
  localStorage.setItem("todos", JSON.stringify(todos));

  // Inputların temizlenmesi ve görev sayılarının güncellenmesi
  toDoInput.value = "";
  toDoDate.value = "";
  toDoPriority.value = "medium";
  ipcRenderer.send("task-added", "A new task has been added"); // Electron'a mesaj gönderme

  totalTasks++;
  incompleteTasks++;
  updateTaskCounts(); // Görev sayılarını güncelleme
  updateTaskChart(); // Görev grafiklerini güncelleme
  loadTodos(); // Görevleri yükleme
}

// Görev listesinin yüklenmesi
function loadTodos() {
  toDoList.innerHTML = ""; // Görev listesini temizle

  let todos = JSON.parse(localStorage.getItem("todos")) || []; // Kayıtlı görevlerin alınması

  // Görevlerin öncelik sırasına göre sıralanması
  todos.sort((a, b) => {
    const priorityOrder = ["high", "medium", "low"];
    return (
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );
  });

  // Her görev için HTML oluşturulması ve ekleme
  todos.forEach(function (todo) {
    const toDoDiv = document.createElement("div"); // Görev div'i oluşturulması
    toDoDiv.classList.add("todo", `${savedTheme}-todo`); // CSS sınıflarının eklenmesi

    if (todo.completed) {
      toDoDiv.classList.add("completed"); // Tamamlanmış görev ise sınıf eklenmesi
    }

    // Görev li elementinin oluşturulması
    const newToDo = document.createElement("li");
    newToDo.innerText = `${todo.task} - ${new Date(
      todo.creationDate
    ).toLocaleDateString()} - ${todo.priority}`;
    newToDo.classList.add("todo-item");
    newToDo.dataset.creationDate = todo.creationDate;
    newToDo.dataset.priority = todo.priority;
    toDoDiv.appendChild(newToDo);

    // Onaylama butonunun oluşturulması
    const checked = document.createElement("button");
    checked.innerHTML = '<i class="fas fa-check"></i>';
    checked.classList.add("check-btn", `${savedTheme}-button`);
    toDoDiv.appendChild(checked);

    // Silme butonunun oluşturulması
    const deleted = document.createElement("button");
    deleted.innerHTML = '<i class="fas fa-trash"></i>';
    deleted.classList.add("delete-btn", `${savedTheme}-button`);
    toDoDiv.appendChild(deleted);

    // Görev div'inin görev listesine eklenmesi
    toDoList.appendChild(toDoDiv);
  });
  // Görev grafiklerinin güncellenmesi
  updateTaskChart();
}

// Görev silme ve onaylama işlemleri
function deletecheck(event) {
  const item = event.target; // Tıklanan elementin alınması

  // Silme butonu ise
  if (item.classList[0] === "delete-btn") {
    ipcRenderer.send("task-deleted", "A task has been deleted"); // Electron'a mesaj gönderme
    totalTasks--; // Toplam görev sayısının azaltılması
    if (!item.parentElement.classList.contains("completed")) {
      incompleteTasks--; // Tamamlanmamış görev sayısının azaltılması
    }
    updateTaskCounts(); // Görev sayılarını güncelleme
    updateTaskChart(); // Görev grafiklerini güncelleme
    item.parentElement.classList.add("fall"); // Silme animasyonu için sınıf eklenmesi
    removeLocalTodos(item.parentElement); // Yerel depodan görevin silinmesi
    item.parentElement.addEventListener("transitionend", function () {
      item.parentElement.remove(); // Animasyon tamamlandığında görev div'inin silinmesi
    });
  }
  // Onaylama butonu ise
  if (item.classList[0] === "check-btn") {
    item.parentElement.classList.toggle("completed"); // Tamamlanmış görev sınıfının eklenip çıkarılması
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    const taskIndex = todos.findIndex(
      (t) => t.task === item.parentElement.children[0].innerText.split(" - ")[0]
    ); // Görevin dizindeki konumunun alınması
    if (item.parentElement.classList.contains("completed")) {
      ipcRenderer.send("task-completed", "A task has been completed"); // Electron'a mesaj gönderme
      completedTasks++; // Tamamlanmış görev sayısının artırılması
      incompleteTasks--; // Tamamlanmamış görev sayısının azaltılması
      todos[taskIndex].completed = true; // Görevin tamamlandı olarak işaretlenmesi
    } else {
      ipcRenderer.send("task-notCompleted", "A task has been not-completed"); // Electron'a mesaj gönderme
      completedTasks--; // Tamamlanmış görev sayısının azaltılması
      incompleteTasks++; // Tamamlanmamış görev sayısının artırılması
      todos[taskIndex].completed = false; // Görevin tamamlanmadı olarak işaretlenmesi
    }
    localStorage.setItem("todos", JSON.stringify(todos)); // Görevlerin güncellenmiş haliyle kaydedilmesi
    updateTaskCounts(); // Görev sayılarını güncelleme
    updateTaskChart(); // Görev grafiklerini güncelleme
  }
}

// Yerel depodan görevin silinmesi
function removeLocalTodos(todo) {
  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  const todoIndex = todos.findIndex(
    (t) => t.task === todo.children[0].innerText.split(" - ")[0]
  ); // Görevin dizindeki konumunun alınması
  todos.splice(todoIndex, 1); // Görevin diziden silinmesi
  localStorage.setItem("todos", JSON.stringify(todos)); // Görevlerin güncellenmiş haliyle kaydedilmesi
  ipcRenderer.send("task-deleted", "Task was also deleted from memory"); // Electron'a mesaj gönderme
}

// Tema değiştirme işlemi
function changeTheme(color) {
  localStorage.setItem("savedTheme", color); // Temanın kaydedilmesi
  savedTheme = localStorage.getItem("savedTheme"); // Kaydedilmiş tema
  document.body.className = color; // Body elementine tema sınıfının eklenmesi

  // Başlık ve input elementlerine tema sınıfının eklenip çıkarılması
  color === "darker"
    ? document.getElementById("title").classList.add("darker-title")
    : document.getElementById("title").classList.remove("darker-title");

  document.querySelector("input").className = `${color}-input`; // Input elementine tema sınıfının eklenmesi

  // Görevlerin ve butonların tema sınıflarının güncellenmesi
  document.querySelectorAll(".todo").forEach((todo) => {
    Array.from(todo.classList).some((item) => item === "completed")
      ? (todo.className = `todo ${color}-todo completed`)
      : (todo.className = `todo ${color}-todo`);
  });

  document.querySelectorAll("button").forEach((button) => {
    Array.from(button.classList).some((item) => {
      if (item === "check-btn") {
        button.className = `check-btn ${color}-button`;
      } else if (item === "delete-btn") {
        button.className = `delete-btn ${color}-button`;
      } else if (item === "todo-btn") {
        button.className = `todo-btn ${color}-button`;
      }
    });
  });
}

// Görev filtreleme fonksiyonları
function filterTasks(period) {
  const allTasks = document.querySelectorAll(".todo-item"); // Tüm görevlerin alınması
  const now = new Date(); // Şu anki tarih

  // Her görev için filtreleme
  allTasks.forEach((task) => {
    const creationDate = new Date(task.dataset.creationDate); // Görevin oluşturulma tarihi
    let showTask = false;

    if (period === "daily") {
      showTask = isSameDay(now, creationDate); // Aynı gün ise göster
    } else if (period === "weekly") {
      showTask = isSameWeek(now, creationDate); // Aynı hafta ise göster
    } else if (period === "monthly") {
      showTask = isSameMonth(now, creationDate); // Aynı ay ise göster
    } else if (period === "nextWeek") {
      showTask = isNextWeek(creationDate); // Gelecek hafta ise göster
    }

    task.parentElement.style.display = showTask ? "flex" : "none"; // Görevin gösterilmesi veya gizlenmesi
  });
}
// Aynı gün kontrolü
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Aynı hafta kontrolü
function isSameWeek(date1, date2) {
  const startOfWeek1 = startOfWeek(date1);
  const startOfWeek2 = startOfWeek(date2);
  return startOfWeek1.getTime() === startOfWeek2.getTime();
}

// Haftanın başlangıcını hesaplama
function startOfWeek(date) {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

// Aynı ay kontrolü
function isSameMonth(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

// Gelecek hafta kontrolü
function isNextWeek(date) {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  return isSameWeek(nextWeek, date);
}


// Birden fazla tarih formatını işlemek için tarih ayrıştırma fonksiyonu

function parseDate(dateString) {
  if (!dateString) return new Date(NaN); // Tarih dizesi yoksa geçersiz tarih döndür

  // Desteklenen tarih formatları
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY veya DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY veya DD-MM-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
  ];

  // Tarih formatlarına göre tarih dizesini ayrıştırma
  for (const format of dateFormats) {
    if (format.test(dateString)) {
      const parts = dateString.split(/[-\/.]/).map(Number);
      switch (format) {
        case dateFormats[0]: // YYYY-MM-DD
        case dateFormats[3]: // YYYY/MM/DD
          return new Date(parts[0], parts[1] - 1, parts[2]);
        case dateFormats[1]: // MM/DD/YYYY
        case dateFormats[2]: // MM-DD-YYYY
          return new Date(parts[2], parts[0] - 1, parts[1]);
        case dateFormats[4]: // DD.MM.YYYY
          return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
  }

  return new Date(NaN); // Geçersiz tarih
}

// CSV dosyasından görevleri içe aktarma fonksiyonu
function importTasksFromCSV(event) {
  const file = event.target.files[0]; //Seçilen CSV dosyasını alır.
  if (!file) {
    alert("No file selected!"); // Dosya seçilmemişse uyarı gösterir.
    return;
  }

  const reader = new FileReader(); //Yeni bir FileReader objesi oluşturulur.

  //Dosya okuma işlemini gerçekleştirir.
  reader.onload = function (e) {
    const content = e.target.result; // Dosya içeriğini alır.
    const rows = content.split("\n").slice(1); // Dosya içeriğini satırlara ayırır. İlk satır (başlık satırı) atılır.
    let todos = JSON.parse(localStorage.getItem("todos")) || []; // Yerel depolamadaki görevleri alır.

    //Her satır için döngü başlatılır.
    rows.forEach((row) => {
      const columns = row.split(","); //Her satırı sütunlara ayırır.
      if (columns.length >= 3) {
        //Sütun sayısı en az 3 ise, gerekli işlemler gerçekleştirilir.

        const [task, creationDate, priority] = columns.map((col) => col.trim()); //Sütunları değişkenlere atar. Çevreleyen boşluklar atılır.
        const parsedDate = parseDate(creationDate); //Oluşturma tarihini JavaScript Date objesine dönüştürür.

        // Oluşturma tarihi geçerli değilse, uyarı gösterir ve görev içeri aktarılamaz.
        if (isNaN(parsedDate)) {
          console.warn(
            `Invalid date "${creationDate}" found for task "${task}". Skipping this task.`
          );
          return;
        }
        //Yeni bir görev objesi oluşturulur. Görev, oluşturma tarihi, öncelik ve tamamlandı durumuna sahiptir.
        const newTask = {
          task,
          creationDate: parsedDate,
          priority,
          completed: false,
        };
        //Yeni görev, yerel depolamadaki görevlerle karşılaştırılır.
        const isDuplicate = todos.some((todo) => {
          return (
            todo.task === newTask.task &&
            new Date(todo.creationDate).getTime() ===
              newTask.creationDate.getTime() &&
            todo.priority === newTask.priority
          );
        });

        if (!isDuplicate) {
          todos.push(newTask); //Yeni göreve benzeyen yoksa, yerel depolamaya eklenir.
        }
      }
    });

    //Görevler, öncelik sırasına göre sıralanır.
    todos.sort((a, b) => {
      const priorityOrder = ["high", "medium", "low"];
      return (
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      );
    });

    localStorage.setItem("todos", JSON.stringify(todos)); // Görevler yerel depolamaya kaydedilir.
    alert("Tasks successfully imported!"); //Görevler başarıyla içeri aktarıldığında uyarı gösterir.

    // Görev sayılarını günceller ve görev listesini yükler.
    totalTasks = todos.length;
    completedTasks = todos.filter((todo) => todo.completed).length;
    incompleteTasks = totalTasks - completedTasks;
    loadTodos();
    updateTaskChart();
  };
  reader.readAsText(file); //Seçilen dosya, metin olarak okunur.
}

// Görevleri CSV dosyasına aktarma fonksiyonu
function exportTasksToCSV() {
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  // Görevleri öncelik sırasına göre sıralama
  todos.sort((a, b) => {
    const priorityOrder = ["high", "medium", "low"];
    return (
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );
  });

  // Görev yoksa uyarı gösterir
  if (todos.length === 0) {
    alert("No tasks to export!");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,"; //CSV içeriği için bir dize oluşturulur.
  csvContent += "Task,Date,Priority\n"; //CSV dosyasının başlıkları eklenir.

  todos.forEach((todo) => {
    //Görev açıklaması, oluşturulma tarihi ve öncelik değerleri birleştirilerek, bir satır oluşturulur.
    let row = `${todo.task},${new Date(
      todo.creationDate
    ).toLocaleDateString()},${todo.priority}\n`;
    csvContent += row; //Her görev için, satır dizesi csvContent dizesine eklenir.
  });

  const encodedUri = encodeURI(csvContent); //CSV içeriği URL kodlanarak dizeye atanır.
  const link = document.createElement("a"); //Yeni bir <a> etiketi oluşturulur.
  link.setAttribute("href", encodedUri); //<a> etiketinin href özelliği, kodlanmış CSV içeriğine ayarlanır.
  link.setAttribute("download", "tasks.csv"); //<a> etiketinin download özelliği, "tasks.csv" olarak ayarlanır.
  document.body.appendChild(link); //<a> etiketi, belge gövdesine eklenir.
  link.click(); // İndirme işlemini tetikler
}

// Görevleri PDF dosyasına aktarma fonksiyonu
function exportTasksToPDF() {
  const { jsPDF } = window.jspdf; //jsPDF kütüphanesinin jsPDF nesnesini alır.
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  // Görevleri öncelik sırasına göre sıralama
  todos.sort((a, b) => {
    const priorityOrder = ["high", "medium", "low"];
    return (
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );
  });

  // Görev yoksa uyarı gösterir
  if (todos.length === 0) {
    alert("No tasks to export!");
    return;
  }

  //Yeni bir jsPDF belgesi oluşturulur ve Y ekseni için başlangıç değeri atanır.
  const doc = new jsPDF();
  let y = 10; //Sayfanın üstten boşluğu ayarlanır.

  //Yazı boyutu 12 olarak ayarlanır. Başlık yazısı belgeye eklendi.
  doc.setFontSize(12);
  doc.text("Task List", 10, y);
  y += 10;

  todos.forEach((todo, index) => {
    const task = `Task: ${todo.task}`; // Görev açıklaması alınır.
    const creationDate = `Date: ${new Date(
      todo.creationDate
    ).toLocaleDateString()}`; //Görev oluşturulma tarihi alınır.
    const priority = `Priority: ${todo.priority}`; //Görev önceliği alınır.

    doc.text(`${index + 1}. ${task}`, 10, y); //Görev açıklaması belgeye eklendi.
    y += 6; //Y ekseni değeri 6 artırılır.Satır aralığı sağlanır.
    doc.text(creationDate, 10, y); //Görev oluşturulma tarihi belgeye eklendi.
    y += 6;
    doc.text(priority, 10, y); // Görev önceliği belgeye eklendi.
    y += 10;
  });

  doc.save("tasks.pdf"); // Belge kaydedilir ve "tasks.pdf" adında bir PDF dosyası oluşturulur.
}
// Görev sayılarını güncelleme fonksiyonu
function updateTaskCounts() {
  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  totalTasks = todos.length;
  completedTasks = todos.filter((todo) => todo.completed).length;
  incompleteTasks = totalTasks - completedTasks;
}

// Görev grafiklerini güncelleme fonksiyonu
function updateTaskChart() {
  if (taskChart) {
    taskChart.destroy(); // Mevcut grafik varsa yok et
  }

  const ctx = document.getElementById("taskChart").getContext("2d");
  taskChart = new Chart(ctx, {
    type: "bar", // Grafik türü: bar grafik
    data: {
      // X ekseni etiketleri
      labels: ["Total Tasks", "Completed Tasks", "Incomplete Tasks"],
      datasets: [
        {
          // Grafik için etiket
          label: "Task Statistics",
          // Görev verileri: toplam, tamamlanan, tamamlanmamış
          data: [totalTasks, completedTasks, incompleteTasks],
          backgroundColor: [
            // Çubuklar için arka plan rengi
            "rgb(126, 138, 151)",
            "rgb(203, 175, 135)",
            "rgb(255, 191, 169)",
          ],
          borderWidth: 1, // Çubukların kenar kalınlığı
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true, // Y ekseninin sıfırdan başlamasını sağla
        },
      },
    },
  });
}
