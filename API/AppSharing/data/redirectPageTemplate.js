/* Copyright (c) 2023 TORITECH LIMITED 2022 */

async function generateHTML(pageInfo) {
  return `
    <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="${pageInfo.title}">
    <meta property="og:description" content="${pageInfo.shortDescription}">
    <meta property="og:image" content="${pageInfo.imageUrl}">
    <!-- Thêm các thẻ meta khác tùy vào yêu cầu -->
    <title>${pageInfo.title}</title>
  
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f4f4f4;
        color: #333;
        margin: 0;
        padding: 0;
        text-align: center;
      }
  
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
  
      p {
        font-size: 18px;
        margin-bottom: 20px;
      }
  
      button {
        background-color: #3498db;
        color: #fff;
        padding: 10px 20px;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
  
      button:hover {
        background-color: #2980b9;
      }
  
      /* Animation for countdown */
      @keyframes countdown {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
  
      .countdown {
        font-size: 24px;
        color: #333;
        animation: countdown 3s linear 0s 1 normal forwards;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <p>Đang chuyển hướng. Vui lòng chờ <span class="countdown">3</span> giây</p>
      <button onclick="redirectToNews()">Chuyển nhanh</button>
    </div>
  
    <script>
      function redirectToNews() {
        var pageUrl = "${pageInfo.pageUrl}";
        // Đảm bảo pageUrl không phải là undefined hoặc null
        if (pageUrl) {
          window.location.href = pageUrl;
        } else {
          console.error('pageUrl is undefined or null');
        }
      }
  
      // Đếm ngược và chuyển hướng sau 3 giây
      var countdownElement = document.querySelector('.countdown');
      var countdown = 3;
  
      function updateCountdown() {
        countdown--;
        countdownElement.textContent = countdown;
  
        if (countdown === 0) {
          redirectToNews();
        } else {
          setTimeout(updateCountdown, 1000);
        }
      }
  
      updateCountdown();
    </script>
  </body>
  </html>
    `;
}
module.exports = {
  generateHTML,
};
