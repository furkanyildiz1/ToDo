////////////////////////
//Tarih ve saat öğesi oluşturma
////////////////////////

document.addEventListener("DOMContentLoaded", (event) => {
  //Mevcut tarih ve saat bilgisini alır ve bunu belirtilen ID'ye sahip bir HTML öğesine yükler.
  function updateDateTime() {
    const dt = new Date();
    document.getElementById("datetime").innerHTML = dt.toLocaleString();
  }

  // Her saniye updateDateTime fonksiyonunu çağırır.
  setInterval(updateDateTime, 1000);

  // İlk yüklemede hemen zamanı gösterir.
  updateDateTime();

  let startTime = new Date().getTime(); //Kronometreyi başlatmak ve durdurmak için kullanılacak bir başlangıç zamanı belirler.
  let timerInterval = null;
  let elapsedSeconds = 0;

  //Bu fonksiyon, geçen süreyi hesaplar ve bir sayaç olarak gösterir (saat, dakika, saniye).
  function updateTimer() {
    const currentTime = new Date().getTime();
    elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    const timerText = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    document.getElementById("datetime-center").innerText = timerText;
  }

  //Kronometreyi başlatan bir fonksiyon tanımlar. Başlangıç zamanını belirler ve setInterval kullanarak updateTimer fonksiyonunu her saniyede bir çağırarak sürekli günceller.
  function startTimer() {
    startTime = new Date().getTime() - elapsedSeconds * 1000;
    timerInterval = setInterval(updateTimer, 1000);
  }
  //Kronometreyi durduran bir fonksiyon tanımlar. setInterval tarafından başlatılan zamanlama işlemini durdurur.
  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Kronometreyi başlatmayı veya durdurmayı sağlayan bir anahtar fonksiyon tanımlar.
  function toggleTimer() {
    const button = document.getElementById("toggle-timer-btn");
    if (timerInterval) {
      stopTimer();
      button.innerText = "Start";                           
    } else {
      startTimer();
      button.innerText = "Stop";
    }
  }

  document
    .getElementById("toggle-timer-btn")
    .addEventListener("click", toggleTimer);

  // İlk yüklemede sayaç başlat
  startTimer();
});

//////////////////////////
//Pomodoro saatin sayfadan aşağı kaydırılması durumunda stil değişlikliği yapılması
////////////////////////

//Sayfa kaydırıldığında çalışacak olan bir olay dinleyicisi eklenir.
window.addEventListener("scroll", function () {
  const timerContainer = document.querySelector(".timer-container");
  //Sayfanın yukarıdan aşağı kaydırılma miktarını kontrol eder.
  //Eğer sayfa 50 pikselden fazla kaydırılmışsa, zamanlayıcı kutusuna 'scrolled' sınıfı eklenir; böylece stil değişikliği yapılabilir.
  if (window.scrollY > 50) {
    timerContainer.classList.add("scrolled");
  } else {
    timerContainer.classList.remove("scrolled");
  }
});

//////////////////////////
//Sayfada aşağı ve yukarı hareket etmemizi saülayan işlem
//////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  const scrollButton = document.getElementById("scrollButton");
  const icon = scrollButton.querySelector("i");

  scrollButton.addEventListener("click", function () {
    if (window.scrollY === 0) {
      // Sayfanın en üstündeyse en alta kaydırır.
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else {
      // Sayfanın herhangi bir yerindeyse en üste kaydırır.
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  window.addEventListener("scroll", function () {
    if (window.scrollY === 0) {
      // Sayfanın en üstündeyken butonun ikonunu aşağı ok olarak değiştir
      icon.classList.remove("rotate-up");
      icon.classList.add("rotate-down");
    } else {
      // Sayfanın en üstünde değilken butonun ikonunu yukarı ok olarak değiştir
      icon.classList.remove("rotate-down");
      icon.classList.add("rotate-up");
    }
  });
});

//////////////////////////
//Açılır panel oluşturma
//////////////////////////

// Sol açılır paneli açma/kapatma işlevi
function togglePanel() {
  const panel = document.getElementById("side-panel");
  const button = document.getElementById("panel-btn");

  //Panelin sol konumunu kontrol eder, eğer panelin sol konumu "0px" ise, panel zaten görünür durumdadır ve kapatılır.
  //Aksi takdirde panel görünür hale getirilir.
  if (panel.style.left === "0px") {
    panel.style.left = "-250px"; // Paneli gizler.
    button.classList.remove("rotate"); // Ok düğmesini eski haline döndürür.
  } else {
    panel.style.left = "0"; // Paneli görünür hale getirir.
    button.classList.add("rotate"); // Ok düğmesini döndürür.
  }
}

document.getElementById("about-btn").addEventListener("click", function () {
  window.open("./HTML/about.html", "_blank");
});

document.getElementById("contact-btn").addEventListener("click", function () {
  window.open("./HTML/contact.html", "_blank");
});

// Açılır paneli tıklanınca açıp kapatır. 
document.getElementById("panel-btn").addEventListener("click", togglePanel);
